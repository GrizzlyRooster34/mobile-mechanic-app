#!/bin/bash

# Master Build Script - Mobile Mechanic App
# Simple interface to all build scripts with intelligent defaults

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts/build"

# Function to show usage
show_usage() {
    echo -e "${BLUE}Mobile Mechanic App - Master Build Script${NC}"
    echo "==========================================="
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo -e "${GREEN}Commands:${NC}"
    echo "  setup                   Setup development environment"
    echo "  validate               Run pre-build validation"
    echo "  dev                    Development build"
    echo "  prod                   Production build"
    echo "  cloud                  Cloud build with EAS"
    echo "  verify                 Verify build outputs"
    echo "  full                   Complete end-to-end workflow"
    echo "  clean                  Clean all build artifacts"
    echo "  examples               Show usage examples"
    echo "  help                   Show this help message"
    echo ""
    echo -e "${GREEN}Global Options:${NC}"
    echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
    echo "  --clean                Clean build"
    echo "  --force                Force operation"
    echo "  --notify               Send notifications"
    echo "  --email EMAIL          Email for notifications"
    echo "  --slack WEBHOOK        Slack webhook URL"
    echo "  --help                 Show help for specific command"
    echo ""
    echo -e "${GREEN}Examples:${NC}"
    echo "  $0 setup                     # Setup development environment"
    echo "  $0 dev --platform android    # Development build for Android"
    echo "  $0 prod --clean --notify     # Clean production build with notifications"
    echo "  $0 cloud --platform ios      # Cloud build for iOS"
    echo "  $0 full --email dev@co.com   # Full workflow with email notifications"
    echo ""
    echo -e "${YELLOW}For detailed examples: $0 examples${NC}"
}

# Function to run setup
run_setup() {
    echo -e "${BLUE}Setting up development environment...${NC}"
    
    local force_flag=""
    local android_flag="--android"
    local global_flag="--global"
    
    # Parse setup-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_flag="--force"
                shift
                ;;
            --no-android)
                android_flag=""
                shift
                ;;
            --no-global)
                global_flag=""
                shift
                ;;
            --help)
                echo "Setup Command Help:"
                echo "  --force        Force reinstall all dependencies"
                echo "  --no-android   Skip Android tools installation"
                echo "  --no-global    Skip global tools installation"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Run dependency installation
    "${SCRIPTS_DIR}/install-dependencies.sh" $force_flag $android_flag $global_flag
    
    # Run validation
    echo ""
    echo -e "${BLUE}Validating setup...${NC}"
    "${SCRIPTS_DIR}/pre-build-validation.sh"
    
    echo ""
    echo -e "${GREEN}Setup completed! You're ready to build.${NC}"
}

# Function to run validation
run_validation() {
    echo -e "${BLUE}Running pre-build validation...${NC}"
    "${SCRIPTS_DIR}/pre-build-validation.sh"
}

# Function to run development build
run_dev_build() {
    local platform="all"
    local clean_flag=""
    local skip_validation=""
    
    # Parse dev-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --clean)
                clean_flag="--clean"
                shift
                ;;
            --skip-validation)
                skip_validation="--skip-validation"
                shift
                ;;
            --help)
                echo "Development Build Help:"
                echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
                echo "  --clean                Clean build"
                echo "  --skip-validation      Skip pre-build validation"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Running development build workflow...${NC}"
    "${SCRIPTS_DIR}/build-automation.sh" --dev-workflow --platform "$platform" $clean_flag $skip_validation
}

# Function to run production build
run_prod_build() {
    local platform="all"
    local clean_flag="--clean"  # Default to clean for production
    local notify_args=""
    
    # Parse prod-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --clean)
                clean_flag="--clean"
                shift
                ;;
            --no-clean)
                clean_flag=""
                shift
                ;;
            --notify)
                notify_args="$notify_args --notify"
                shift
                ;;
            --email)
                notify_args="$notify_args --email $2"
                shift 2
                ;;
            --slack)
                notify_args="$notify_args --slack $2"
                shift 2
                ;;
            --help)
                echo "Production Build Help:"
                echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
                echo "  --clean                Clean build [default]"
                echo "  --no-clean             Don't clean build"
                echo "  --notify               Send notifications"
                echo "  --email EMAIL          Email for notifications"
                echo "  --slack WEBHOOK        Slack webhook URL"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Running production build workflow...${NC}"
    "${SCRIPTS_DIR}/build-automation.sh" --prod-workflow --platform "$platform" $clean_flag $notify_args
}

# Function to run cloud build
run_cloud_build() {
    local platform="all"
    local profile="production"
    local auto_submit=""
    local notify_args=""
    
    # Parse cloud-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --profile)
                profile="$2"
                shift 2
                ;;
            --auto-submit)
                auto_submit="--auto-submit"
                shift
                ;;
            --notify)
                notify_args="$notify_args --notify"
                shift
                ;;
            --email)
                notify_args="$notify_args --email $2"
                shift 2
                ;;
            --slack)
                notify_args="$notify_args --slack $2"
                shift 2
                ;;
            --help)
                echo "Cloud Build Help:"
                echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
                echo "  --profile PROFILE      Build profile (development|preview|production) [default: production]"
                echo "  --auto-submit          Auto-submit to stores"
                echo "  --notify               Send notifications"
                echo "  --email EMAIL          Email for notifications"
                echo "  --slack WEBHOOK        Slack webhook URL"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Running cloud build workflow...${NC}"
    "${SCRIPTS_DIR}/build-automation.sh" --cloud-workflow --platform "$platform" $auto_submit $notify_args
}

# Function to run verification
run_verification() {
    local platform="all"
    local build_type="production"
    local deep_flag=""
    local performance_flag=""
    local security_flag=""
    
    # Parse verify-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --type)
                build_type="$2"
                shift 2
                ;;
            --deep)
                deep_flag="--deep"
                shift
                ;;
            --performance)
                performance_flag="--performance"
                shift
                ;;
            --security)
                security_flag="--security"
                shift
                ;;
            --all)
                deep_flag="--deep"
                performance_flag="--performance"
                security_flag="--security"
                shift
                ;;
            --help)
                echo "Verification Help:"
                echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
                echo "  --type TYPE            Build type (development|production) [default: production]"
                echo "  --deep                 Deep verification (APK/IPA analysis)"
                echo "  --performance          Performance checks"
                echo "  --security             Security scans"
                echo "  --all                  All verification types"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Running build verification...${NC}"
    "${SCRIPTS_DIR}/post-build-verification.sh" --platform "$platform" --type "$build_type" $deep_flag $performance_flag $security_flag
}

# Function to run full workflow
run_full_workflow() {
    local platform="all"
    local notify_args=""
    
    # Parse full-specific options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --notify)
                notify_args="$notify_args --notify"
                shift
                ;;
            --email)
                notify_args="$notify_args --email $2"
                shift 2
                ;;
            --slack)
                notify_args="$notify_args --slack $2"
                shift 2
                ;;
            --help)
                echo "Full Workflow Help:"
                echo "  --platform PLATFORM    Platform (android|ios|all) [default: all]"
                echo "  --notify               Send notifications"
                echo "  --email EMAIL          Email for notifications"
                echo "  --slack WEBHOOK        Slack webhook URL"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Running complete end-to-end workflow...${NC}"
    "${SCRIPTS_DIR}/build-automation.sh" --full-workflow --platform "$platform" $notify_args
}

# Function to clean builds
run_clean() {
    echo -e "${BLUE}Cleaning all build artifacts...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Remove build directories
    local dirs_to_clean=("builds" "android/app/build" "ios/build" ".expo" "dist" "node_modules/.cache")
    
    for dir in "${dirs_to_clean[@]}"; do
        if [ -d "$dir" ]; then
            echo "Removing $dir..."
            rm -rf "$dir"
        fi
    done
    
    # Clean logs older than 7 days
    find scripts/build -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    
    # Clear caches
    npm cache clean --force 2>/dev/null || true
    npx expo r -c 2>/dev/null || true
    
    echo -e "${GREEN}Clean completed!${NC}"
}

# Function to show examples
show_examples() {
    "${SCRIPTS_DIR}/usage-examples.sh"
}

# Main function
main() {
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${RED}Error: This script must be run from the project root directory${NC}"
        echo "Current directory: $(pwd)"
        echo "Expected directory: $PROJECT_ROOT"
        exit 1
    fi
    
    # Check if scripts directory exists
    if [ ! -d "$SCRIPTS_DIR" ]; then
        echo -e "${RED}Error: Build scripts directory not found: $SCRIPTS_DIR${NC}"
        exit 1
    fi
    
    # Parse command
    local command=""
    if [[ $# -gt 0 ]]; then
        command="$1"
        shift
    fi
    
    case $command in
        "setup")
            run_setup "$@"
            ;;
        "validate")
            run_validation "$@"
            ;;
        "dev")
            run_dev_build "$@"
            ;;
        "prod")
            run_prod_build "$@"
            ;;
        "cloud")
            run_cloud_build "$@"
            ;;
        "verify")
            run_verification "$@"
            ;;
        "full")
            run_full_workflow "$@"
            ;;
        "clean")
            run_clean "$@"
            ;;
        "examples")
            show_examples "$@"
            ;;
        "help"|"--help"|"-h"|"")
            show_usage
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"