#!/bin/bash

# Build Automation Workflow Script
# This script orchestrates the complete build process with error recovery and monitoring

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
LOG_FILE="${PROJECT_ROOT}/scripts/build/automation.log"
WORKFLOW_TYPE=""
PLATFORM=""
BUILD_TYPE=""
CLEAN_BUILD=false
SKIP_VALIDATION=false
AUTO_VERIFY=true
AUTO_SUBMIT=false
SEND_NOTIFICATIONS=false
EMAIL_RECIPIENT=""
SLACK_WEBHOOK=""

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Build Automation Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Workflow Types:"
    echo "  --dev-workflow              Complete development build workflow"
    echo "  --prod-workflow             Complete production build workflow"
    echo "  --cloud-workflow            Complete cloud build workflow"
    echo "  --full-workflow             Complete end-to-end workflow (all platforms, all builds)"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM     Platform to build for (android|ios|all)"
    echo "  -t, --type TYPE             Build type (development|production)"
    echo "  -c, --clean                 Clean build (remove all caches and artifacts)"
    echo "  -s, --skip-validation       Skip pre-build validation"
    echo "  -n, --no-verify             Skip post-build verification"
    echo "  -a, --auto-submit           Auto-submit production builds to stores"
    echo "  --notify                    Send notifications on completion"
    echo "  --email EMAIL               Email address for notifications"
    echo "  --slack WEBHOOK             Slack webhook URL for notifications"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --dev-workflow --platform android"
    echo "  $0 --prod-workflow --platform all --clean --notify"
    echo "  $0 --cloud-workflow --platform ios --auto-submit"
    echo "  $0 --full-workflow --email dev@company.com"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev-workflow)
                WORKFLOW_TYPE="development"
                BUILD_TYPE="development"
                shift
                ;;
            --prod-workflow)
                WORKFLOW_TYPE="production"
                BUILD_TYPE="production"
                shift
                ;;
            --cloud-workflow)
                WORKFLOW_TYPE="cloud"
                BUILD_TYPE="production"
                shift
                ;;
            --full-workflow)
                WORKFLOW_TYPE="full"
                shift
                ;;
            -p|--platform)
                PLATFORM="$2"
                shift 2
                ;;
            -t|--type)
                BUILD_TYPE="$2"
                shift 2
                ;;
            -c|--clean)
                CLEAN_BUILD=true
                shift
                ;;
            -s|--skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            -n|--no-verify)
                AUTO_VERIFY=false
                shift
                ;;
            -a|--auto-submit)
                AUTO_SUBMIT=true
                shift
                ;;
            --notify)
                SEND_NOTIFICATIONS=true
                shift
                ;;
            --email)
                EMAIL_RECIPIENT="$2"
                SEND_NOTIFICATIONS=true
                shift 2
                ;;
            --slack)
                SLACK_WEBHOOK="$2"
                SEND_NOTIFICATIONS=true
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
    
    # Validate workflow type
    if [ -z "$WORKFLOW_TYPE" ]; then
        log_error "Workflow type is required. Use --dev-workflow, --prod-workflow, --cloud-workflow, or --full-workflow"
        exit 1
    fi
    
    # Set defaults
    if [ -z "$PLATFORM" ]; then
        PLATFORM="all"
    fi
    
    if [ -z "$BUILD_TYPE" ]; then
        BUILD_TYPE="production"
    fi
    
    # Validate platform
    if [[ ! "$PLATFORM" =~ ^(android|ios|all)$ ]]; then
        log_error "Invalid platform: $PLATFORM. Must be 'android', 'ios', or 'all'"
        exit 1
    fi
    
    # Validate build type
    if [[ ! "$BUILD_TYPE" =~ ^(development|production)$ ]]; then
        log_error "Invalid build type: $BUILD_TYPE. Must be 'development' or 'production'"
        exit 1
    fi
}

# Function to setup environment
setup_environment() {
    log_info "Setting up build environment..."
    
    cd "$PROJECT_ROOT"
    
    # Create necessary directories
    mkdir -p "${PROJECT_ROOT}/scripts/build"
    mkdir -p "${PROJECT_ROOT}/builds"
    mkdir -p "${PROJECT_ROOT}/logs"
    
    # Set environment variables
    export NODE_ENV="$BUILD_TYPE"
    export EXPO_DEBUG=$([ "$BUILD_TYPE" = "development" ] && echo "true" || echo "false")
    export DEBUG=$([ "$BUILD_TYPE" = "development" ] && echo "1" || echo "0")
    
    log_info "Environment setup completed"
    echo "ENV: Environment setup for $BUILD_TYPE build" >> "$LOG_FILE"
}

# Function to send notifications
send_notification() {
    local subject=$1
    local message=$2
    local status=$3  # success, warning, error
    
    if [ "$SEND_NOTIFICATIONS" = false ]; then
        return 0
    fi
    
    log_info "Sending notification: $subject"
    
    # Send email notification
    if [ -n "$EMAIL_RECIPIENT" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENT" || log_warning "Failed to send email notification"
        echo "NOTIFICATION: Email sent to $EMAIL_RECIPIENT" >> "$LOG_FILE"
    fi
    
    # Send Slack notification
    if [ -n "$SLACK_WEBHOOK" ] && command -v curl &> /dev/null; then
        local color
        case $status in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
            *) color="good" ;;
        esac
        
        local payload="{\"text\":\"$subject\",\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}"
        
        if curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" > /dev/null; then
            log_success "Slack notification sent"
            echo "NOTIFICATION: Slack notification sent" >> "$LOG_FILE"
        else
            log_warning "Failed to send Slack notification"
        fi
    fi
}

# Function to run development workflow
run_development_workflow() {
    log_info "=== RUNNING DEVELOPMENT WORKFLOW ==="
    
    local workflow_errors=0
    
    # Step 1: Pre-build validation
    if [ "$SKIP_VALIDATION" = false ]; then
        log_info "Step 1: Running pre-build validation..."
        if bash "$SCRIPT_DIR/pre-build-validation.sh"; then
            log_success "Pre-build validation passed"
            echo "WORKFLOW: Development validation passed" >> "$LOG_FILE"
        else
            log_error "Pre-build validation failed"
            echo "ERROR: Development validation failed" >> "$LOG_FILE"
            ((workflow_errors++))
            return $workflow_errors
        fi
    fi
    
    # Step 2: Development build
    log_info "Step 2: Running development build..."
    local build_args="--platform $PLATFORM"
    if [ "$CLEAN_BUILD" = true ]; then
        build_args="$build_args --clean"
    fi
    
    if bash "$SCRIPT_DIR/local-build-dev.sh" $build_args; then
        log_success "Development build completed"
        echo "WORKFLOW: Development build completed" >> "$LOG_FILE"
    else
        log_error "Development build failed"
        echo "ERROR: Development build failed" >> "$LOG_FILE"
        ((workflow_errors++))
        return $workflow_errors
    fi
    
    # Step 3: Post-build verification
    if [ "$AUTO_VERIFY" = true ]; then
        log_info "Step 3: Running post-build verification..."
        if bash "$SCRIPT_DIR/post-build-verification.sh" --platform "$PLATFORM" --type development; then
            log_success "Post-build verification passed"
            echo "WORKFLOW: Development verification passed" >> "$LOG_FILE"
        else
            log_warning "Post-build verification had issues"
            echo "WARNING: Development verification issues" >> "$LOG_FILE"
        fi
    fi
    
    return $workflow_errors
}

# Function to run production workflow
run_production_workflow() {
    log_info "=== RUNNING PRODUCTION WORKFLOW ==="
    
    local workflow_errors=0
    
    # Step 1: Pre-build validation
    if [ "$SKIP_VALIDATION" = false ]; then
        log_info "Step 1: Running pre-build validation..."
        if bash "$SCRIPT_DIR/pre-build-validation.sh"; then
            log_success "Pre-build validation passed"
            echo "WORKFLOW: Production validation passed" >> "$LOG_FILE"
        else
            log_error "Pre-build validation failed"
            echo "ERROR: Production validation failed" >> "$LOG_FILE"
            ((workflow_errors++))
            return $workflow_errors
        fi
    fi
    
    # Step 2: Production build
    log_info "Step 2: Running production build..."
    local build_args="--platform $PLATFORM"
    if [ "$CLEAN_BUILD" = true ]; then
        build_args="$build_args --clean"
    fi
    
    if bash "$SCRIPT_DIR/local-build-prod.sh" $build_args; then
        log_success "Production build completed"
        echo "WORKFLOW: Production build completed" >> "$LOG_FILE"
    else
        log_error "Production build failed"
        echo "ERROR: Production build failed" >> "$LOG_FILE"
        ((workflow_errors++))
        return $workflow_errors
    fi
    
    # Step 3: Post-build verification with deep checks
    if [ "$AUTO_VERIFY" = true ]; then
        log_info "Step 3: Running comprehensive post-build verification..."
        if bash "$SCRIPT_DIR/post-build-verification.sh" --platform "$PLATFORM" --type production --deep --performance --security; then
            log_success "Comprehensive verification passed"
            echo "WORKFLOW: Production verification passed" >> "$LOG_FILE"
        else
            log_error "Comprehensive verification failed"
            echo "ERROR: Production verification failed" >> "$LOG_FILE"
            ((workflow_errors++))
            return $workflow_errors
        fi
    fi
    
    return $workflow_errors
}

# Function to run cloud workflow
run_cloud_workflow() {
    log_info "=== RUNNING CLOUD WORKFLOW ==="
    
    local workflow_errors=0
    
    # Step 1: Pre-build validation
    if [ "$SKIP_VALIDATION" = false ]; then
        log_info "Step 1: Running pre-build validation..."
        if bash "$SCRIPT_DIR/pre-build-validation.sh"; then
            log_success "Pre-build validation passed"
            echo "WORKFLOW: Cloud validation passed" >> "$LOG_FILE"
        else
            log_error "Pre-build validation failed"
            echo "ERROR: Cloud validation failed" >> "$LOG_FILE"
            ((workflow_errors++))
            return $workflow_errors
        fi
    fi
    
    # Step 2: Cloud build with EAS
    log_info "Step 2: Running cloud build with EAS..."
    local build_args="--platform $PLATFORM --profile production"
    if [ "$AUTO_SUBMIT" = true ]; then
        build_args="$build_args --auto-submit"
    fi
    
    if bash "$SCRIPT_DIR/cloud-build-eas.sh" $build_args; then
        log_success "Cloud build completed"
        echo "WORKFLOW: Cloud build completed" >> "$LOG_FILE"
    else
        log_error "Cloud build failed"
        echo "ERROR: Cloud build failed" >> "$LOG_FILE"
        ((workflow_errors++))
        return $workflow_errors
    fi
    
    # Step 3: Post-build verification of downloaded artifacts
    if [ "$AUTO_VERIFY" = true ]; then
        log_info "Step 3: Running post-build verification on cloud artifacts..."
        if bash "$SCRIPT_DIR/post-build-verification.sh" --platform "$PLATFORM" --type production --deep; then
            log_success "Cloud artifact verification passed"
            echo "WORKFLOW: Cloud verification passed" >> "$LOG_FILE"
        else
            log_warning "Cloud artifact verification had issues"
            echo "WARNING: Cloud verification issues" >> "$LOG_FILE"
        fi
    fi
    
    return $workflow_errors
}

# Function to run full workflow
run_full_workflow() {
    log_info "=== RUNNING FULL END-TO-END WORKFLOW ==="
    
    local workflow_errors=0
    
    # Step 1: Development workflow
    log_info "Phase 1: Development Workflow"
    local original_build_type="$BUILD_TYPE"
    BUILD_TYPE="development"
    
    if run_development_workflow; then
        log_success "Development workflow completed successfully"
        echo "WORKFLOW: Full development phase completed" >> "$LOG_FILE"
    else
        log_error "Development workflow failed"
        echo "ERROR: Full development phase failed" >> "$LOG_FILE"
        ((workflow_errors++))
    fi
    
    # Step 2: Production workflow
    log_info "Phase 2: Production Workflow"
    BUILD_TYPE="production"
    
    if run_production_workflow; then
        log_success "Production workflow completed successfully"
        echo "WORKFLOW: Full production phase completed" >> "$LOG_FILE"
    else
        log_error "Production workflow failed"
        echo "ERROR: Full production phase failed" >> "$LOG_FILE"
        ((workflow_errors++))
    fi
    
    # Step 3: Cloud workflow (if no errors so far)
    if [ $workflow_errors -eq 0 ]; then
        log_info "Phase 3: Cloud Workflow"
        
        if run_cloud_workflow; then
            log_success "Cloud workflow completed successfully"
            echo "WORKFLOW: Full cloud phase completed" >> "$LOG_FILE"
        else
            log_error "Cloud workflow failed"
            echo "ERROR: Full cloud phase failed" >> "$LOG_FILE"
            ((workflow_errors++))
        fi
    else
        log_warning "Skipping cloud workflow due to previous errors"
        echo "WARNING: Full cloud phase skipped due to errors" >> "$LOG_FILE"
    fi
    
    # Restore original build type
    BUILD_TYPE="$original_build_type"
    
    return $workflow_errors
}

# Function to cleanup build artifacts
cleanup_old_artifacts() {
    log_info "Cleaning up old build artifacts..."
    
    cd "$PROJECT_ROOT"
    
    # Clean old logs (keep last 10)
    if [ -d "logs" ]; then
        find logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
        log_info "Cleaned old log files"
    fi
    
    # Clean old build artifacts (keep last 5 builds per platform)
    if [ -d "builds" ]; then
        # Keep only recent APK files
        find builds -name "*.apk" -type f | sort -t- -k2 -n | head -n -5 | xargs rm -f 2>/dev/null || true
        
        # Keep only recent AAB files
        find builds -name "*.aab" -type f | sort -t- -k2 -n | head -n -5 | xargs rm -f 2>/dev/null || true
        
        # Keep only recent IPA files
        find builds -name "*.ipa" -type f | sort -t- -k2 -n | head -n -5 | xargs rm -f 2>/dev/null || true
        
        log_info "Cleaned old build artifacts"
    fi
    
    echo "CLEANUP: Old artifacts cleaned" >> "$LOG_FILE"
}

# Function to generate workflow report
generate_workflow_report() {
    local workflow_result=$1
    
    log_info "Generating workflow report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/workflow-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Build Automation Workflow Report
======================================================

Workflow Date: $(date)
Workflow Type: $WORKFLOW_TYPE
Platform: $PLATFORM
Build Type: $BUILD_TYPE
Clean Build: $CLEAN_BUILD

Configuration:
- Skip Validation: $SKIP_VALIDATION
- Auto Verify: $AUTO_VERIFY
- Auto Submit: $AUTO_SUBMIT
- Send Notifications: $SEND_NOTIFICATIONS

Workflow Steps Executed:
EOF
    
    # Add workflow-specific steps
    case $WORKFLOW_TYPE in
        "development")
            echo "1. Pre-build validation ($([ "$SKIP_VALIDATION" = true ] && echo "SKIPPED" || echo "EXECUTED"))" >> "$report_file"
            echo "2. Development build (EXECUTED)" >> "$report_file"
            echo "3. Post-build verification ($([ "$AUTO_VERIFY" = true ] && echo "EXECUTED" || echo "SKIPPED"))" >> "$report_file"
            ;;
        "production")
            echo "1. Pre-build validation ($([ "$SKIP_VALIDATION" = true ] && echo "SKIPPED" || echo "EXECUTED"))" >> "$report_file"
            echo "2. Production build (EXECUTED)" >> "$report_file"
            echo "3. Comprehensive verification ($([ "$AUTO_VERIFY" = true ] && echo "EXECUTED" || echo "SKIPPED"))" >> "$report_file"
            ;;
        "cloud")
            echo "1. Pre-build validation ($([ "$SKIP_VALIDATION" = true ] && echo "SKIPPED" || echo "EXECUTED"))" >> "$report_file"
            echo "2. Cloud build with EAS (EXECUTED)" >> "$report_file"
            echo "3. Artifact verification ($([ "$AUTO_VERIFY" = true ] && echo "EXECUTED" || echo "SKIPPED"))" >> "$report_file"
            ;;
        "full")
            echo "Phase 1: Development workflow (EXECUTED)" >> "$report_file"
            echo "Phase 2: Production workflow (EXECUTED)" >> "$report_file"
            echo "Phase 3: Cloud workflow (EXECUTED)" >> "$report_file"
            ;;
    esac
    
    echo "" >> "$report_file"
    echo "Workflow Result: $([ $workflow_result -eq 0 ] && echo "SUCCESS" || echo "FAILED ($workflow_result errors)")" >> "$report_file"
    
    # Add build artifacts summary
    echo "" >> "$report_file"
    echo "Build Artifacts Generated:" >> "$report_file"
    
    if [ -d "${PROJECT_ROOT}/builds" ]; then
        find "${PROJECT_ROOT}/builds" -name "*.apk" -o -name "*.aab" -o -name "*.ipa" | while read -r artifact; do
            local file_size
            file_size=$(du -h "$artifact" | cut -f1)
            echo "- $(basename "$artifact") ($file_size)" >> "$report_file"
        done
    fi
    
    # Add log files references
    echo "" >> "$report_file"
    echo "Log Files:" >> "$report_file"
    echo "- Main workflow log: scripts/build/automation.log" >> "$report_file"
    echo "- Validation log: scripts/build/validation.log" >> "$report_file"
    echo "- Build logs: scripts/build/*-build.log" >> "$report_file"
    echo "- Verification log: scripts/build/verification.log" >> "$report_file"
    
    echo "" >> "$report_file"
    echo "Workflow completed at: $(date)" >> "$report_file"
    
    log_success "Workflow report generated: $report_file"
    echo "REPORT: Workflow report generated" >> "$LOG_FILE"
}

# Main workflow function
main() {
    log_info "=== BUILD AUTOMATION WORKFLOW STARTED ==="
    log_info "Workflow Type: $WORKFLOW_TYPE"
    log_info "Platform: $PLATFORM"
    log_info "Build Type: $BUILD_TYPE"
    log_info "Clean Build: $CLEAN_BUILD"
    
    local start_time
    start_time=$(date +%s)
    
    # Setup environment
    setup_environment
    
    # Cleanup old artifacts if clean build
    if [ "$CLEAN_BUILD" = true ]; then
        cleanup_old_artifacts
    fi
    
    # Send start notification
    send_notification "Build Workflow Started" "Starting $WORKFLOW_TYPE workflow for $PLATFORM platform" "success"
    
    # Run the appropriate workflow
    local workflow_errors=0
    
    case $WORKFLOW_TYPE in
        "development")
            run_development_workflow || workflow_errors=$?
            ;;
        "production")
            run_production_workflow || workflow_errors=$?
            ;;
        "cloud")
            run_cloud_workflow || workflow_errors=$?
            ;;
        "full")
            run_full_workflow || workflow_errors=$?
            ;;
        *)
            log_error "Unknown workflow type: $WORKFLOW_TYPE"
            workflow_errors=1
            ;;
    esac
    
    # Calculate execution time
    local end_time
    local duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # Generate workflow report
    generate_workflow_report $workflow_errors
    
    # Send completion notification
    local notification_subject
    local notification_message
    local notification_status
    
    if [ $workflow_errors -eq 0 ]; then
        notification_subject="Build Workflow Completed Successfully"
        notification_message="$WORKFLOW_TYPE workflow completed successfully for $PLATFORM platform. Duration: ${duration}s"
        notification_status="success"
        log_success "=== BUILD AUTOMATION WORKFLOW COMPLETED SUCCESSFULLY ==="
        log_success "Workflow completed in ${duration} seconds"
        log_success "Check workflow report: ${PROJECT_ROOT}/scripts/build/workflow-report.txt"
    else
        notification_subject="Build Workflow Failed"
        notification_message="$WORKFLOW_TYPE workflow failed with $workflow_errors errors for $PLATFORM platform. Duration: ${duration}s"
        notification_status="error"
        log_error "=== BUILD AUTOMATION WORKFLOW FAILED ==="
        log_error "Workflow failed with $workflow_errors errors after ${duration} seconds"
        log_error "Check logs and reports for details"
    fi
    
    send_notification "$notification_subject" "$notification_message" "$notification_status"
    
    # Final log entry
    echo "Workflow completed: $(date)" >> "$LOG_FILE"
    echo "Duration: ${duration} seconds" >> "$LOG_FILE"
    echo "Result: $([ $workflow_errors -eq 0 ] && echo "SUCCESS" || echo "FAILED ($workflow_errors errors)")" >> "$LOG_FILE"
    
    exit $workflow_errors
}

# Handle script interruption
trap 'log_error "Workflow interrupted"; send_notification "Build Workflow Interrupted" "Build automation workflow was interrupted" "warning"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main