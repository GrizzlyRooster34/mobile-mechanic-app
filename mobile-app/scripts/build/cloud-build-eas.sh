#!/bin/bash

# Cloud Build Script with EAS
# This script manages cloud builds using Expo Application Services (EAS)

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Project configuration
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${PROJECT_ROOT}/scripts/build/cloud-build.log"
PLATFORM=""
PROFILE="production"
AUTO_SUBMIT=false
SKIP_VALIDATION=false
WAIT_FOR_COMPLETION=true
MAX_RETRIES=3
RETRY_DELAY=300  # 5 minutes

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Cloud Build Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Platform to build for (android|ios|all)"
    echo "  -r, --profile PROFILE      Build profile (development|preview|production)"
    echo "  -s, --skip-validation      Skip pre-build validation"
    echo "  -a, --auto-submit          Automatically submit to stores after build"
    echo "  -n, --no-wait              Don't wait for build completion"
    echo "  -m, --max-retries COUNT    Maximum retry attempts (default: 3)"
    echo "  -d, --retry-delay SECONDS  Delay between retries (default: 300)"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Build Profiles:"
    echo "  development - Development build with debugging"
    echo "  preview     - Preview build for testing"
    echo "  production  - Production build for app stores"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android --profile production"
    echo "  $0 --platform all --profile preview --no-wait"
    echo "  $0 --platform ios --profile production --auto-submit"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--platform)
                PLATFORM="$2"
                shift 2
                ;;
            -r|--profile)
                PROFILE="$2"
                shift 2
                ;;
            -s|--skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            -a|--auto-submit)
                AUTO_SUBMIT=true
                shift
                ;;
            -n|--no-wait)
                WAIT_FOR_COMPLETION=false
                shift
                ;;
            -m|--max-retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            -d|--retry-delay)
                RETRY_DELAY="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Default platform to all if not specified
    if [ -z "$PLATFORM" ]; then
        PLATFORM="all"
    fi
    
    # Validate platform
    if [[ ! "$PLATFORM" =~ ^(android|ios|all)$ ]]; then
        log_error "Invalid platform: $PLATFORM. Must be 'android', 'ios', or 'all'"
        exit 1
    fi
    
    # Validate profile
    if [[ ! "$PROFILE" =~ ^(development|preview|production)$ ]]; then
        log_error "Invalid profile: $PROFILE. Must be 'development', 'preview', or 'production'"
        exit 1
    fi
    
    # Validate numeric arguments
    if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]]; then
        log_error "Invalid max-retries: $MAX_RETRIES. Must be a number"
        exit 1
    fi
    
    if ! [[ "$RETRY_DELAY" =~ ^[0-9]+$ ]]; then
        log_error "Invalid retry-delay: $RETRY_DELAY. Must be a number"
        exit 1
    fi
}

# Function to check EAS authentication
check_eas_auth() {
    log_info "Checking EAS authentication..."
    
    cd "$PROJECT_ROOT"
    
    # Check if EAS CLI is available
    if ! command -v eas &> /dev/null && ! npx eas --version &> /dev/null; then
        log_error "EAS CLI not found. Please install it with: npm install -g @expo/eas-cli"
        echo "ERROR: EAS CLI not found" >> "$LOG_FILE"
        exit 1
    fi
    
    # Check authentication status
    local eas_cmd="eas"
    if ! command -v eas &> /dev/null; then
        eas_cmd="npx eas"
    fi
    
    if $eas_cmd whoami &> /dev/null; then
        local username
        username=$($eas_cmd whoami 2>/dev/null || echo "unknown")
        log_success "EAS authentication verified (user: $username)"
        echo "AUTH: EAS authenticated as $username" >> "$LOG_FILE"
    else
        log_error "EAS authentication required. Please run: $eas_cmd login"
        echo "ERROR: EAS not authenticated" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to check project configuration
check_project_config() {
    log_info "Checking project configuration for cloud build..."
    
    cd "$PROJECT_ROOT"
    
    # Check eas.json
    if [ ! -f "eas.json" ]; then
        log_error "eas.json not found. Please run: eas build:configure"
        echo "ERROR: eas.json missing" >> "$LOG_FILE"
        exit 1
    fi
    
    # Validate eas.json structure
    if ! node -e "
        const config = JSON.parse(require('fs').readFileSync('eas.json', 'utf8'));
        if (!config.build) throw new Error('Missing build config');
        if (!config.build['$PROFILE']) throw new Error('Missing profile: $PROFILE');
        console.log('EAS config structure is valid');
    " 2>/dev/null; then
        log_error "Invalid eas.json structure or missing profile: $PROFILE"
        echo "ERROR: invalid eas.json or missing profile $PROFILE" >> "$LOG_FILE"
        exit 1
    fi
    
    # Check app.json for project ID
    if node -e "
        const config = JSON.parse(require('fs').readFileSync('app.json', 'utf8'));
        if (!config.expo?.extra?.eas?.projectId) throw new Error('Missing EAS project ID');
        console.log('EAS project ID found:', config.expo.extra.eas.projectId);
    " 2>/dev/null; then
        log_success "EAS project configuration verified"
        echo "CONFIG: EAS project config verified" >> "$LOG_FILE"
    else
        log_error "EAS project ID not found in app.json. Please run: eas build:configure"
        echo "ERROR: EAS project ID missing" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to check build queue and credits
check_build_resources() {
    log_info "Checking EAS build resources..."
    
    cd "$PROJECT_ROOT"
    
    local eas_cmd="eas"
    if ! command -v eas &> /dev/null; then
        eas_cmd="npx eas"
    fi
    
    # Check build credits (if available)
    if $eas_cmd build:list --limit=1 &> /dev/null; then
        log_success "EAS build access verified"
        echo "RESOURCES: EAS build access OK" >> "$LOG_FILE"
    else
        log_warning "Could not verify EAS build access"
        echo "WARNING: EAS build access check failed" >> "$LOG_FILE"
    fi
    
    # Check recent builds to see queue status
    log_info "Checking recent builds and queue status..."
    if $eas_cmd build:list --limit=5 --json 2>/dev/null | jq -r '.[].status' | grep -q "in-queue\|in-progress"; then
        log_warning "There are builds currently in queue or in progress"
        echo "WARNING: builds in queue/progress" >> "$LOG_FILE"
    else
        log_info "No builds currently in queue"
        echo "RESOURCES: no builds in queue" >> "$LOG_FILE"
    fi
}

# Function to start cloud build
start_cloud_build() {
    local platform=$1
    local attempt=${2:-1}
    
    log_info "Starting cloud build for $platform (attempt $attempt/$MAX_RETRIES)..."
    
    cd "$PROJECT_ROOT"
    
    local eas_cmd="eas"
    if ! command -v eas &> /dev/null; then
        eas_cmd="npx eas"
    fi
    
    # Prepare build command
    local build_cmd="$eas_cmd build --platform $platform --profile $PROFILE --non-interactive"
    
    # Add auto-submit if requested and profile is production
    if [ "$AUTO_SUBMIT" = true ] && [ "$PROFILE" = "production" ]; then
        build_cmd="$build_cmd --auto-submit"
        log_info "Auto-submit enabled for production build"
    fi
    
    log_info "Running: $build_cmd"
    echo "BUILD: Starting $platform build with profile $PROFILE (attempt $attempt)" >> "$LOG_FILE"
    
    # Start the build
    local build_output
    local build_exit_code=0
    
    if [ "$WAIT_FOR_COMPLETION" = true ]; then
        log_info "Starting build and waiting for completion..."
        build_output=$($build_cmd 2>&1) || build_exit_code=$?
    else
        log_info "Starting build in non-blocking mode..."
        build_output=$($build_cmd --no-wait 2>&1) || build_exit_code=$?
    fi
    
    # Process build result
    if [ $build_exit_code -eq 0 ]; then
        log_success "Cloud build for $platform completed successfully"
        echo "BUILD: $platform build successful (attempt $attempt)" >> "$LOG_FILE"
        
        # Extract build ID and URL if available
        local build_id
        local build_url
        
        build_id=$(echo "$build_output" | grep -oE "Build ID: [a-f0-9-]+" | head -1 | cut -d' ' -f3)
        build_url=$(echo "$build_output" | grep -oE "https://expo.dev/[^[:space:]]+" | head -1)
        
        if [ -n "$build_id" ]; then
            log_info "Build ID: $build_id"
            echo "BUILD: $platform build ID $build_id" >> "$LOG_FILE"
        fi
        
        if [ -n "$build_url" ]; then
            log_info "Build URL: $build_url"
            echo "BUILD: $platform build URL $build_url" >> "$LOG_FILE"
        fi
        
        # Save build output
        echo "$build_output" > "${PROJECT_ROOT}/scripts/build/cloud-build-${platform}-output.txt"
        
        return 0
    else
        log_error "Cloud build for $platform failed (attempt $attempt)"
        echo "ERROR: $platform build failed (attempt $attempt)" >> "$LOG_FILE"
        echo "$build_output" >> "$LOG_FILE"
        
        # Save error output
        echo "$build_output" > "${PROJECT_ROOT}/scripts/build/cloud-build-${platform}-error.txt"
        
        # Retry if not max attempts
        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "Retrying build in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
            start_cloud_build "$platform" $((attempt + 1))
        else
            log_error "Max retry attempts reached for $platform build"
            return 1
        fi
    fi
}

# Function to monitor build progress
monitor_build_progress() {
    local platform=$1
    
    log_info "Monitoring build progress for $platform..."
    
    cd "$PROJECT_ROOT"
    
    local eas_cmd="eas"
    if ! command -v eas &> /dev/null; then
        eas_cmd="npx eas"
    fi
    
    # Get latest build for platform
    local build_id
    build_id=$($eas_cmd build:list --platform "$platform" --limit=1 --json 2>/dev/null | jq -r '.[0].id' 2>/dev/null || echo "")
    
    if [ -n "$build_id" ] && [ "$build_id" != "null" ]; then
        log_info "Monitoring build: $build_id"
        
        # Monitor build status
        local status="in-progress"
        local check_count=0
        local max_checks=120  # 2 hours with 1-minute intervals
        
        while [ "$status" = "in-progress" ] || [ "$status" = "in-queue" ]; do
            if [ $check_count -ge $max_checks ]; then
                log_error "Build monitoring timeout reached"
                echo "ERROR: build monitoring timeout" >> "$LOG_FILE"
                return 1
            fi
            
            sleep 60  # Check every minute
            ((check_count++))
            
            status=$($eas_cmd build:list --platform "$platform" --limit=1 --json 2>/dev/null | jq -r '.[0].status' 2>/dev/null || echo "unknown")
            
            case $status in
                "in-queue")
                    log_info "Build is in queue... (check $check_count/$max_checks)"
                    ;;
                "in-progress")
                    log_info "Build is in progress... (check $check_count/$max_checks)"
                    ;;
                "finished")
                    log_success "Build completed successfully!"
                    echo "BUILD: $platform build finished" >> "$LOG_FILE"
                    return 0
                    ;;
                "errored"|"failed")
                    log_error "Build failed!"
                    echo "ERROR: $platform build failed" >> "$LOG_FILE"
                    return 1
                    ;;
                "canceled")
                    log_warning "Build was canceled"
                    echo "WARNING: $platform build canceled" >> "$LOG_FILE"
                    return 1
                    ;;
                *)
                    log_warning "Unknown build status: $status"
                    ;;
            esac
        done
    else
        log_warning "Could not find build ID for monitoring"
        echo "WARNING: could not monitor build" >> "$LOG_FILE"
    fi
}

# Function to download build artifacts
download_build_artifacts() {
    local platform=$1
    
    log_info "Downloading build artifacts for $platform..."
    
    cd "$PROJECT_ROOT"
    
    local eas_cmd="eas"
    if ! command -v eas &> /dev/null; then
        eas_cmd="npx eas"
    fi
    
    # Create downloads directory
    mkdir -p "${PROJECT_ROOT}/builds"
    
    # Get latest successful build
    local build_info
    build_info=$($eas_cmd build:list --platform "$platform" --limit=10 --json 2>/dev/null | jq -r '.[] | select(.status == "finished") | select(.artifacts != null) | @base64' | head -1)
    
    if [ -n "$build_info" ]; then
        local build_data
        build_data=$(echo "$build_info" | base64 -d)
        
        local build_id
        local artifact_url
        
        build_id=$(echo "$build_data" | jq -r '.id')
        artifact_url=$(echo "$build_data" | jq -r '.artifacts.buildUrl // .artifacts.applicationArchiveUrl // empty')
        
        if [ -n "$artifact_url" ] && [ "$artifact_url" != "null" ]; then
            log_info "Downloading build artifact from: $artifact_url"
            
            local filename
            case $platform in
                "android")
                    if [[ "$artifact_url" == *.aab ]]; then
                        filename="mobile-mechanic-${build_id}.aab"
                    else
                        filename="mobile-mechanic-${build_id}.apk"
                    fi
                    ;;
                "ios")
                    filename="mobile-mechanic-${build_id}.ipa"
                    ;;
            esac
            
            if curl -L -o "${PROJECT_ROOT}/builds/$filename" "$artifact_url"; then
                log_success "Build artifact downloaded: ${PROJECT_ROOT}/builds/$filename"
                echo "DOWNLOAD: $platform artifact downloaded as $filename" >> "$LOG_FILE"
                
                # Verify file size
                local file_size
                file_size=$(du -h "${PROJECT_ROOT}/builds/$filename" | cut -f1)
                log_info "Downloaded file size: $file_size"
                echo "DOWNLOAD: $platform artifact size $file_size" >> "$LOG_FILE"
            else
                log_error "Failed to download build artifact"
                echo "ERROR: failed to download $platform artifact" >> "$LOG_FILE"
                return 1
            fi
        else
            log_warning "No artifact URL found for latest build"
            echo "WARNING: no artifact URL for $platform" >> "$LOG_FILE"
        fi
    else
        log_warning "No successful builds found for $platform"
        echo "WARNING: no successful builds for $platform" >> "$LOG_FILE"
    fi
}

# Function to generate cloud build report
generate_cloud_report() {
    log_info "Generating cloud build report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/cloud-build-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Cloud Build Report
========================================

Build Date: $(date)
Platform: $PLATFORM
Profile: $PROFILE
Auto Submit: $AUTO_SUBMIT
Wait for Completion: $WAIT_FOR_COMPLETION

Project Information:
- Project Root: $PROJECT_ROOT
- EAS CLI Version: $(npx eas --version 2>/dev/null || echo "unknown")

Build Configuration:
- Build Profile: $PROFILE
- Max Retries: $MAX_RETRIES
- Retry Delay: $RETRY_DELAY seconds

Build Results:
EOF
    
    # Add build results
    local platforms_built=()
    case $PLATFORM in
        "android")
            platforms_built=("android")
            ;;
        "ios")
            platforms_built=("ios")
            ;;
        "all")
            platforms_built=("android" "ios")
            ;;
    esac
    
    for platform in "${platforms_built[@]}"; do
        echo "" >> "$report_file"
        echo "$platform Build:" >> "$report_file"
        
        if [ -f "${PROJECT_ROOT}/scripts/build/cloud-build-${platform}-output.txt" ]; then
            echo "- Status: SUCCESS" >> "$report_file"
            echo "- Output file: scripts/build/cloud-build-${platform}-output.txt" >> "$report_file"
        elif [ -f "${PROJECT_ROOT}/scripts/build/cloud-build-${platform}-error.txt" ]; then
            echo "- Status: FAILED" >> "$report_file"
            echo "- Error file: scripts/build/cloud-build-${platform}-error.txt" >> "$report_file"
        else
            echo "- Status: UNKNOWN" >> "$report_file"
        fi
        
        # Check for downloaded artifacts
        if find "${PROJECT_ROOT}/builds" -name "*${platform}*" -type f 2>/dev/null | grep -q .; then
            echo "- Artifacts:" >> "$report_file"
            find "${PROJECT_ROOT}/builds" -name "*${platform}*" -type f 2>/dev/null | while read -r artifact; do
                echo "  - $(basename "$artifact") ($(du -h "$artifact" | cut -f1))" >> "$report_file"
            done
        fi
    done
    
    echo "" >> "$report_file"
    echo "Build Log: $LOG_FILE" >> "$report_file"
    echo "Cloud build completed at: $(date)" >> "$report_file"
    
    log_success "Cloud build report generated: $report_file"
    echo "REPORT: generated at $report_file" >> "$LOG_FILE"
}

# Main cloud build function
main() {
    log_info "=== CLOUD BUILD WITH EAS STARTED ==="
    log_info "Platform: $PLATFORM"
    log_info "Profile: $PROFILE"
    log_info "Auto Submit: $AUTO_SUBMIT"
    log_info "Wait for Completion: $WAIT_FOR_COMPLETION"
    log_info "Max Retries: $MAX_RETRIES"
    log_info "Retry Delay: $RETRY_DELAY seconds"
    
    # Run pre-build validation unless skipped
    if [ "$SKIP_VALIDATION" = false ]; then
        log_info "Running pre-build validation..."
        if [ -f "$SCRIPT_DIR/pre-build-validation.sh" ]; then
            if bash "$SCRIPT_DIR/pre-build-validation.sh"; then
                log_success "Pre-build validation passed"
                echo "VALIDATION: passed" >> "$LOG_FILE"
            else
                log_error "Pre-build validation failed"
                echo "ERROR: validation failed" >> "$LOG_FILE"
                exit 1
            fi
        else
            log_warning "Pre-build validation script not found, skipping"
            echo "WARNING: validation script not found" >> "$LOG_FILE"
        fi
    else
        log_warning "Skipping pre-build validation"
        echo "VALIDATION: skipped" >> "$LOG_FILE"
    fi
    
    # Check EAS authentication
    check_eas_auth
    
    # Check project configuration
    check_project_config
    
    # Check build resources
    check_build_resources
    
    # Start cloud builds
    local build_errors=0
    
    case $PLATFORM in
        "android")
            if ! start_cloud_build "android"; then
                ((build_errors++))
            fi
            ;;
        "ios")
            if ! start_cloud_build "ios"; then
                ((build_errors++))
            fi
            ;;
        "all")
            if ! start_cloud_build "android"; then
                ((build_errors++))
            fi
            if ! start_cloud_build "ios"; then
                ((build_errors++))
            fi
            ;;
    esac
    
    # Download build artifacts if builds were successful
    if [ $build_errors -eq 0 ] && [ "$WAIT_FOR_COMPLETION" = true ]; then
        log_info "Downloading build artifacts..."
        
        case $PLATFORM in
            "android")
                download_build_artifacts "android"
                ;;
            "ios")
                download_build_artifacts "ios"
                ;;
            "all")
                download_build_artifacts "android"
                download_build_artifacts "ios"
                ;;
        esac
    fi
    
    # Generate cloud build report
    generate_cloud_report
    
    # Final result
    echo "Cloud build completed: $(date)" >> "$LOG_FILE"
    
    if [ $build_errors -eq 0 ]; then
        log_success "=== CLOUD BUILD COMPLETED SUCCESSFULLY ==="
        log_success "All builds completed successfully for platform: $PLATFORM"
        log_success "Check build report: ${PROJECT_ROOT}/scripts/build/cloud-build-report.txt"
        
        if [ "$WAIT_FOR_COMPLETION" = false ]; then
            log_info "Builds started in non-blocking mode. Check EAS dashboard for progress."
        fi
        
        exit 0
    else
        log_error "=== CLOUD BUILD FAILED ==="
        log_error "Found $build_errors build errors"
        log_error "Check error files and logs for details"
        echo "RESULT: FAILED ($build_errors errors)" >> "$LOG_FILE"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Cloud build interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main