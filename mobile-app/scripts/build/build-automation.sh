#!/bin/bash

# Advanced Build Automation Script
# Comprehensive build orchestration with monitoring, validation, and recovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts/build"
LOGS_DIR="${PROJECT_ROOT}/logs"
BUILDS_DIR="${PROJECT_ROOT}/builds"
MONITOR_DIR="${SCRIPTS_DIR}/monitor"

# Build configuration
PLATFORM="all"
BUILD_TYPE="development"
CLEAN_BUILD=false
SKIP_VALIDATION=false
ENABLE_MONITORING=true
ENABLE_NOTIFICATIONS=false
AUTO_RECOVERY=true
PARALLEL_BUILDS=false

# Notification settings
EMAIL_NOTIFICATIONS=""
SLACK_WEBHOOK=""
DISCORD_WEBHOOK=""

# Performance settings
MAX_MEMORY_USAGE=2048  # MB
MAX_BUILD_TIME=1800    # 30 minutes
MONITOR_INTERVAL=10    # seconds

# Create necessary directories
setup_directories() {
    local dirs=("$LOGS_DIR" "$BUILDS_DIR" "$MONITOR_DIR" "$LOGS_DIR/builds" "$LOGS_DIR/monitor")
    
    for dir in "${dirs[@]}"; do
        [[ ! -d "$dir" ]] && mkdir -p "$dir"
    done
}

# Logging functions
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="$LOGS_DIR/build-automation.log"
    
    case $level in
        "INFO")  echo -e "${BLUE}[${timestamp}] [INFO] ${message}${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] [SUCCESS] ${message}${NC}" ;;
        "WARN")  echo -e "${YELLOW}[${timestamp}] [WARN] ${message}${NC}" ;;
        "ERROR") echo -e "${RED}[${timestamp}] [ERROR] ${message}${NC}" ;;
        "DEBUG") echo -e "${CYAN}[${timestamp}] [DEBUG] ${message}${NC}" ;;
    esac
    
    echo "[${timestamp}] [${level}] ${message}" >> "$log_file"
}

# Error handling with recovery
handle_error() {
    local error_code=$?
    local line_number=$1
    local command=$2
    
    log "ERROR" "Build failed at line $line_number: $command (exit code: $error_code)"
    
    if [[ "$AUTO_RECOVERY" == "true" ]]; then
        log "INFO" "Attempting automatic error recovery..."
        attempt_recovery "$error_code" "$command"
    fi
    
    send_notification "error" "Build failed: $command"
    cleanup_on_failure
    exit $error_code
}

# Set up error trap
trap 'handle_error ${LINENO} "$BASH_COMMAND"' ERR

# Recovery mechanisms
attempt_recovery() {
    local error_code=$1
    local failed_command=$2
    
    case $failed_command in
        *"npm"*)
            log "INFO" "NPM error detected, attempting recovery..."
            npm cache clean --force
            rm -rf node_modules package-lock.json
            npm install
            ;;
        *"expo"*)
            log "INFO" "Expo error detected, attempting recovery..."
            npx expo r -c
            ;;
        *"gradle"*)
            log "INFO" "Gradle error detected, attempting recovery..."
            cd "$PROJECT_ROOT/android"
            ./gradlew clean
            cd "$PROJECT_ROOT"
            ;;
        *"xcodebuild"*)
            log "INFO" "Xcode error detected, attempting recovery..."
            rm -rf "$PROJECT_ROOT/ios/build"
            ;;
    esac
}

# System monitoring
start_system_monitor() {
    if [[ "$ENABLE_MONITORING" != "true" ]]; then
        return
    fi
    
    log "INFO" "Starting system monitoring..."
    
    # Memory monitoring
    (
        while true; do
            local memory_usage=$(ps -o pid,vsz,rss,pcpu,comm -p $$ | tail -1 | awk '{print $2/1024}')
            if (( $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l) )); then
                log "WARN" "High memory usage detected: ${memory_usage}MB"
                send_notification "warning" "High memory usage: ${memory_usage}MB"
            fi
            sleep $MONITOR_INTERVAL
        done
    ) &
    
    MEMORY_MONITOR_PID=$!
    echo "$MEMORY_MONITOR_PID" > "$LOGS_DIR/monitor_pids"
    
    # Build time monitoring
    BUILD_START_TIME=$(date +%s)
    (
        sleep $MAX_BUILD_TIME
        log "ERROR" "Build timeout exceeded ($MAX_BUILD_TIME seconds)"
        send_notification "error" "Build timeout exceeded"
        kill -TERM $$
    ) &
    
    TIMEOUT_MONITOR_PID=$!
    echo "$TIMEOUT_MONITOR_PID" >> "$LOGS_DIR/monitor_pids"
}

stop_system_monitor() {
    if [[ -f "$LOGS_DIR/monitor_pids" ]]; then
        while read -r pid; do
            kill "$pid" 2>/dev/null || true
        done < "$LOGS_DIR/monitor_pids"
        rm -f "$LOGS_DIR/monitor_pids"
    fi
}

# Notification system
send_notification() {
    local type=$1
    local message=$2
    
    if [[ "$ENABLE_NOTIFICATIONS" != "true" ]]; then
        return
    fi
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local emoji=""
    
    case $type in
        "success") emoji="✅" ;;
        "error") emoji="❌" ;;
        "warning") emoji="⚠️" ;;
        "info") emoji="ℹ️" ;;
    esac
    
    # Email notification
    if [[ -n "$EMAIL_NOTIFICATIONS" ]]; then
        send_email_notification "$type" "$message"
    fi
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        send_slack_notification "$type" "$message" "$emoji"
    fi
    
    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        send_discord_notification "$type" "$message" "$emoji"
    fi
}

send_slack_notification() {
    local type=$1
    local message=$2
    local emoji=$3
    
    local color=""
    case $type in
        "success") color="good" ;;
        "error") color="danger" ;;
        "warning") color="warning" ;;
        *) color="#36a64f" ;;
    esac
    
    local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$emoji Mobile Mechanic Build $type",
            "text": "$message",
            "fields": [
                {
                    "title": "Platform",
                    "value": "$PLATFORM",
                    "short": true
                },
                {
                    "title": "Build Type",
                    "value": "$BUILD_TYPE",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S')",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" || true
}

send_discord_notification() {
    local type=$1
    local message=$2
    local emoji=$3
    
    local color=""
    case $type in
        "success") color=65280 ;;  # Green
        "error") color=16711680 ;;  # Red
        "warning") color=16776960 ;; # Yellow
        *) color=3447003 ;;  # Blue
    esac
    
    local payload=$(cat <<EOF
{
    "embeds": [
        {
            "title": "$emoji Mobile Mechanic Build $type",
            "description": "$message",
            "color": $color,
            "fields": [
                {
                    "name": "Platform",
                    "value": "$PLATFORM",
                    "inline": true
                },
                {
                    "name": "Build Type", 
                    "value": "$BUILD_TYPE",
                    "inline": true
                }
            ],
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' --data "$payload" "$DISCORD_WEBHOOK" || true
}

# Pre-build validation
run_pre_build_validation() {
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log "INFO" "Skipping pre-build validation"
        return
    fi
    
    log "INFO" "Running comprehensive pre-build validation..."
    
    # Check required files
    local required_files=("package.json" "tsconfig.json" "app.json" "eas.json")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log "ERROR" "Required file missing: $file"
            exit 1
        fi
    done
    log "SUCCESS" "Required files validation passed"
    
    # Validate Node.js and npm versions
    local node_version=$(node --version | sed 's/v//')
    local npm_version=$(npm --version)
    log "INFO" "Node.js version: $node_version"
    log "INFO" "NPM version: $npm_version"
    
    # Check Node.js version requirement
    if ! node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 16 ? 0 : 1)"; then
        log "ERROR" "Node.js version 16 or higher required"
        exit 1
    fi
    
    # Validate TypeScript
    log "INFO" "Validating TypeScript configuration..."
    npx tsc --noEmit --skipLibCheck
    log "SUCCESS" "TypeScript validation passed"
    
    # Check dependencies
    log "INFO" "Validating dependencies..."
    npm ls --depth=0 || log "WARN" "Some dependency issues detected"
    
    # Security audit
    log "INFO" "Running security audit..."
    npm audit --audit-level=high || log "WARN" "Security vulnerabilities detected"
    
    # Check disk space
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 1048576 ]]; then  # Less than 1GB
        log "WARN" "Low disk space: ${available_space}KB available"
    fi
    
    # Platform-specific validation
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        validate_android_environment
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        validate_ios_environment
    fi
    
    log "SUCCESS" "Pre-build validation completed"
}

validate_android_environment() {
    log "INFO" "Validating Android build environment..."
    
    # Check Android SDK
    if [[ -z "$ANDROID_HOME" ]]; then
        log "WARN" "ANDROID_HOME not set"
    fi
    
    # Check Java version
    if command -v java >/dev/null 2>&1; then
        local java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
        log "INFO" "Java version: $java_version"
    else
        log "WARN" "Java not found in PATH"
    fi
    
    # Check Gradle wrapper
    if [[ -f "android/gradlew" ]]; then
        log "SUCCESS" "Gradle wrapper found"
        cd android
        ./gradlew tasks --quiet >/dev/null
        cd ..
        log "SUCCESS" "Gradle validation passed"
    else
        log "WARN" "Gradle wrapper not found"
    fi
}

validate_ios_environment() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log "INFO" "Skipping iOS validation (not on macOS)"
        return
    fi
    
    log "INFO" "Validating iOS build environment..."
    
    # Check Xcode
    if command -v xcodebuild >/dev/null 2>&1; then
        local xcode_version=$(xcodebuild -version | head -1)
        log "INFO" "Xcode version: $xcode_version"
    else
        log "WARN" "Xcode not found"
    fi
    
    # Check CocoaPods
    if command -v pod >/dev/null 2>&1; then
        local pod_version=$(pod --version)
        log "INFO" "CocoaPods version: $pod_version"
    else
        log "WARN" "CocoaPods not found"
    fi
    
    # Validate iOS project
    if [[ -f "ios/Podfile" ]]; then
        log "SUCCESS" "iOS Podfile found"
    else
        log "WARN" "iOS Podfile not found"
    fi
}

# Build execution with monitoring
execute_build() {
    log "INFO" "Executing build for platform: $PLATFORM, type: $BUILD_TYPE"
    
    # Start real-time monitoring if available
    if [[ -f "$MONITOR_DIR/real-time-monitor.js" && "$ENABLE_MONITORING" == "true" ]]; then
        log "INFO" "Starting real-time build monitor..."
        node "$MONITOR_DIR/real-time-monitor.js" &
        BUILD_MONITOR_PID=$!
        echo "$BUILD_MONITOR_PID" >> "$LOGS_DIR/monitor_pids"
    fi
    
    # Clean build if requested
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        clean_build_artifacts
    fi
    
    # Execute platform-specific builds
    case $PLATFORM in
        "android")
            build_android
            ;;
        "ios")
            build_ios
            ;;
        "all")
            if [[ "$PARALLEL_BUILDS" == "true" ]]; then
                build_parallel
            else
                build_android
                build_ios
            fi
            ;;
        *)
            log "ERROR" "Unknown platform: $PLATFORM"
            exit 1
            ;;
    esac
}

clean_build_artifacts() {
    log "INFO" "Cleaning build artifacts..."
    
    local dirs_to_clean=(
        "builds"
        "android/app/build"
        "ios/build" 
        ".expo"
        "dist"
        "node_modules/.cache"
    )
    
    for dir in "${dirs_to_clean[@]}"; do
        if [[ -d "$dir" ]]; then
            log "INFO" "Removing $dir..."
            rm -rf "$dir"
        fi
    done
    
    # Clear npm cache
    npm cache clean --force
    
    # Clear Expo cache
    npx expo r -c
    
    log "SUCCESS" "Build artifacts cleaned"
}

build_android() {
    log "INFO" "Building Android application..."
    
    local build_start=$(date +%s)
    local android_log="$LOGS_DIR/builds/android-build-$(date +%Y%m%d-%H%M%S).log"
    
    # Set build profile based on build type
    local profile="development"
    case $BUILD_TYPE in
        "production") profile="production" ;;
        "preview") profile="preview" ;;
        "development") profile="development" ;;
    esac
    
    log "INFO" "Using EAS build profile: $profile"
    
    # Execute EAS build
    if eas build --platform android --profile "$profile" --non-interactive --wait 2>&1 | tee "$android_log"; then
        local build_end=$(date +%s)
        local build_duration=$((build_end - build_start))
        
        log "SUCCESS" "Android build completed in ${build_duration}s"
        send_notification "success" "Android build completed successfully (${build_duration}s)"
        
        # Save build metrics
        save_build_metrics "android" "$build_duration" "success"
    else
        local build_end=$(date +%s)
        local build_duration=$((build_end - build_start))
        
        log "ERROR" "Android build failed after ${build_duration}s"
        send_notification "error" "Android build failed after ${build_duration}s"
        
        save_build_metrics "android" "$build_duration" "failed"
        return 1
    fi
}

build_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log "INFO" "Skipping iOS build (not on macOS)"
        return
    fi
    
    log "INFO" "Building iOS application..."
    
    local build_start=$(date +%s)
    local ios_log="$LOGS_DIR/builds/ios-build-$(date +%Y%m%d-%H%M%S).log"
    
    # Set build profile
    local profile="development"
    case $BUILD_TYPE in
        "production") profile="production" ;;
        "preview") profile="preview" ;;
        "development") profile="development" ;;
    esac
    
    log "INFO" "Using EAS build profile: $profile"
    
    # Execute EAS build
    if eas build --platform ios --profile "$profile" --non-interactive --wait 2>&1 | tee "$ios_log"; then
        local build_end=$(date +%s)
        local build_duration=$((build_end - build_start))
        
        log "SUCCESS" "iOS build completed in ${build_duration}s"
        send_notification "success" "iOS build completed successfully (${build_duration}s)"
        
        save_build_metrics "ios" "$build_duration" "success"
    else
        local build_end=$(date +%s)
        local build_duration=$((build_end - build_start))
        
        log "ERROR" "iOS build failed after ${build_duration}s"
        send_notification "error" "iOS build failed after ${build_duration}s"
        
        save_build_metrics "ios" "$build_duration" "failed"
        return 1
    fi
}

build_parallel() {
    log "INFO" "Starting parallel builds for Android and iOS..."
    
    # Start Android build in background
    (build_android) &
    local android_pid=$!
    
    # Start iOS build in background (if on macOS)
    local ios_pid=""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        (build_ios) &
        ios_pid=$!
    fi
    
    # Wait for builds to complete
    local android_result=0
    local ios_result=0
    
    wait $android_pid || android_result=$?
    
    if [[ -n "$ios_pid" ]]; then
        wait $ios_pid || ios_result=$?
    fi
    
    # Check results
    if [[ $android_result -eq 0 && $ios_result -eq 0 ]]; then
        log "SUCCESS" "All parallel builds completed successfully"
    else
        log "ERROR" "One or more parallel builds failed"
        return 1
    fi
}

save_build_metrics() {
    local platform=$1
    local duration=$2
    local status=$3
    
    local metrics_file="$LOGS_DIR/builds/metrics-${platform}-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$metrics_file" <<EOF
{
    "platform": "$platform",
    "buildType": "$BUILD_TYPE",
    "duration": $duration,
    "status": "$status",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)",
    "hostOS": "$OSTYPE"
}
EOF
    
    log "INFO" "Build metrics saved to $metrics_file"
}

# Post-build verification
run_post_build_verification() {
    log "INFO" "Running post-build verification..."
    
    # Check if build artifacts exist
    local verification_passed=true
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        if ! verify_android_build; then
            verification_passed=false
        fi
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        if ! verify_ios_build; then
            verification_passed=false
        fi
    fi
    
    if [[ "$verification_passed" == "true" ]]; then
        log "SUCCESS" "Post-build verification passed"
        send_notification "success" "Build verification completed successfully"
    else
        log "ERROR" "Post-build verification failed"
        send_notification "error" "Build verification failed"
        return 1
    fi
}

verify_android_build() {
    log "INFO" "Verifying Android build..."
    
    # Check for recent build logs
    local recent_android_log=$(find "$LOGS_DIR/builds" -name "android-build-*.log" -mmin -60 | head -1)
    if [[ -n "$recent_android_log" ]]; then
        if grep -q "Build successful" "$recent_android_log"; then
            log "SUCCESS" "Android build verification passed"
            return 0
        fi
    fi
    
    log "WARN" "Could not verify Android build"
    return 1
}

verify_ios_build() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log "INFO" "Skipping iOS build verification (not on macOS)"
        return 0
    fi
    
    log "INFO" "Verifying iOS build..."
    
    # Check for recent build logs
    local recent_ios_log=$(find "$LOGS_DIR/builds" -name "ios-build-*.log" -mmin -60 | head -1)
    if [[ -n "$recent_ios_log" ]]; then
        if grep -q "Build successful" "$recent_ios_log"; then
            log "SUCCESS" "iOS build verification passed"
            return 0
        fi
    fi
    
    log "WARN" "Could not verify iOS build"
    return 1
}

# Cleanup function
cleanup() {
    log "INFO" "Performing cleanup..."
    
    # Stop monitoring processes
    stop_system_monitor
    
    # Stop build monitor if running
    if [[ -n "$BUILD_MONITOR_PID" ]]; then
        kill "$BUILD_MONITOR_PID" 2>/dev/null || true
    fi
    
    # Calculate total build time
    if [[ -n "$BUILD_START_TIME" ]]; then
        local build_end=$(date +%s)
        local total_duration=$((build_end - BUILD_START_TIME))
        log "INFO" "Total build time: ${total_duration}s"
    fi
    
    log "SUCCESS" "Cleanup completed"
}

cleanup_on_failure() {
    log "ERROR" "Build failed, performing cleanup..."
    cleanup
}

# Trap cleanup on exit
trap cleanup EXIT

# Workflow functions
dev_workflow() {
    log "INFO" "Starting development workflow..."
    
    run_pre_build_validation
    execute_build
    run_post_build_verification
    
    log "SUCCESS" "Development workflow completed"
}

prod_workflow() {
    log "INFO" "Starting production workflow..."
    
    # Force clean build for production
    CLEAN_BUILD=true
    
    run_pre_build_validation
    execute_build
    run_post_build_verification
    
    # Additional production checks
    log "INFO" "Running production-specific checks..."
    
    log "SUCCESS" "Production workflow completed"
}

cloud_workflow() {
    log "INFO" "Starting cloud build workflow..."
    
    # Enable monitoring for cloud builds
    ENABLE_MONITORING=true
    ENABLE_NOTIFICATIONS=true
    
    run_pre_build_validation
    execute_build
    run_post_build_verification
    
    log "SUCCESS" "Cloud workflow completed"
}

full_workflow() {
    log "INFO" "Starting complete end-to-end workflow..."
    
    # Enable all features for full workflow
    ENABLE_MONITORING=true
    ENABLE_NOTIFICATIONS=true
    AUTO_RECOVERY=true
    CLEAN_BUILD=true
    
    run_pre_build_validation
    execute_build
    run_post_build_verification
    
    log "SUCCESS" "Full workflow completed"
}

# Command-line argument parsing
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            --build-type)
                BUILD_TYPE="$2"
                shift 2
                ;;
            --clean)
                CLEAN_BUILD=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --disable-monitoring)
                ENABLE_MONITORING=false
                shift
                ;;
            --notify)
                ENABLE_NOTIFICATIONS=true
                shift
                ;;
            --email)
                EMAIL_NOTIFICATIONS="$2"
                ENABLE_NOTIFICATIONS=true
                shift 2
                ;;
            --slack)
                SLACK_WEBHOOK="$2"
                ENABLE_NOTIFICATIONS=true
                shift 2
                ;;
            --discord)
                DISCORD_WEBHOOK="$2"
                ENABLE_NOTIFICATIONS=true
                shift 2
                ;;
            --parallel)
                PARALLEL_BUILDS=true
                shift
                ;;
            --dev-workflow)
                WORKFLOW="dev"
                shift
                ;;
            --prod-workflow)
                WORKFLOW="prod"
                shift
                ;;
            --cloud-workflow)
                WORKFLOW="cloud"
                shift
                ;;
            --full-workflow)
                WORKFLOW="full"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown argument: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Advanced Build Automation Script

Usage: $0 [OPTIONS] [WORKFLOW]

OPTIONS:
    --platform PLATFORM     Target platform (android|ios|all) [default: all]
    --build-type TYPE       Build type (development|preview|production) [default: development]
    --clean                 Clean build artifacts before building
    --skip-validation       Skip pre-build validation
    --disable-monitoring    Disable build monitoring
    --notify                Enable notifications
    --email EMAIL           Email for notifications
    --slack WEBHOOK         Slack webhook URL
    --discord WEBHOOK       Discord webhook URL
    --parallel              Run parallel builds (Android + iOS)

WORKFLOWS:
    --dev-workflow         Development workflow
    --prod-workflow        Production workflow
    --cloud-workflow       Cloud build workflow
    --full-workflow        Complete end-to-end workflow

EXAMPLES:
    $0 --dev-workflow --platform android
    $0 --prod-workflow --clean --notify --slack https://hooks.slack.com/...
    $0 --full-workflow --parallel --email dev@company.com

EOF
}

# Main execution
main() {
    log "INFO" "Starting Advanced Build Automation System"
    log "INFO" "Project: Mobile Mechanic App"
    log "INFO" "Script version: 2.0"
    
    # Setup
    setup_directories
    start_system_monitor
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate configuration
    if [[ ! "$PLATFORM" =~ ^(android|ios|all)$ ]]; then
        log "ERROR" "Invalid platform: $PLATFORM"
        exit 1
    fi
    
    if [[ ! "$BUILD_TYPE" =~ ^(development|preview|production)$ ]]; then
        log "ERROR" "Invalid build type: $BUILD_TYPE"
        exit 1
    fi
    
    # Execute workflow
    case $WORKFLOW in
        "dev")
            dev_workflow
            ;;
        "prod")
            prod_workflow
            ;;
        "cloud")
            cloud_workflow
            ;;
        "full")
            full_workflow
            ;;
        *)
            # Default workflow
            dev_workflow
            ;;
    esac
    
    log "SUCCESS" "Build automation completed successfully!"
    send_notification "success" "Build automation completed successfully"
}

# Execute main function with all arguments
main "$@"