#!/bin/bash

# Local Development Build Script
# This script builds the app locally for development with debugging enabled

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
LOG_FILE="${PROJECT_ROOT}/scripts/build/dev-build.log"
BUILD_TYPE="development"
PLATFORM=""
SKIP_VALIDATION=false
CLEAN_BUILD=false

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Development Build Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Platform to build for (android|ios|all)"
    echo "  -c, --clean                 Clean build (remove node_modules and reinstall)"
    echo "  -s, --skip-validation      Skip pre-build validation"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android      Build for Android only"
    echo "  $0 --platform ios          Build for iOS only"
    echo "  $0 --platform all          Build for both platforms"
    echo "  $0 --clean                 Clean build for all platforms"
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
            -c|--clean)
                CLEAN_BUILD=true
                shift
                ;;
            -s|--skip-validation)
                SKIP_VALIDATION=true
                shift
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
}

# Function to clean project
clean_project() {
    log_info "Cleaning project..."
    
    cd "$PROJECT_ROOT"
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        log_info "Removing node_modules..."
        rm -rf node_modules
        log_success "node_modules removed"
        echo "CLEAN: node_modules removed" >> "$LOG_FILE"
    fi
    
    # Remove npm cache
    log_info "Clearing npm cache..."
    npm cache clean --force
    log_success "npm cache cleared"
    echo "CLEAN: npm cache cleared" >> "$LOG_FILE"
    
    # Remove Expo cache
    if command -v npx &> /dev/null; then
        log_info "Clearing Expo cache..."
        npx expo r -c || log_warning "Could not clear Expo cache"
        echo "CLEAN: Expo cache cleared" >> "$LOG_FILE"
    fi
    
    # Remove build artifacts
    local artifacts=(".expo" "dist" "build" "android/app/build" "ios/build")
    for artifact in "${artifacts[@]}"; do
        if [ -d "$artifact" ]; then
            log_info "Removing $artifact..."
            rm -rf "$artifact"
            echo "CLEAN: $artifact removed" >> "$LOG_FILE"
        fi
    done
    
    log_success "Project cleaned successfully"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Running npm install..."
    if npm install --verbose; then
        log_success "Dependencies installed successfully"
        echo "DEPS: npm install successful" >> "$LOG_FILE"
    else
        log_error "Failed to install dependencies"
        echo "ERROR: npm install failed" >> "$LOG_FILE"
        exit 1
    fi
    
    # Verify installation
    log_info "Verifying dependency installation..."
    if npm ls --depth=0 &> /dev/null; then
        log_success "All dependencies are properly installed"
        echo "DEPS: verification successful" >> "$LOG_FILE"
    else
        log_warning "Some dependencies may have issues"
        npm ls --depth=0 || true
        echo "WARNING: dependency verification had issues" >> "$LOG_FILE"
    fi
}

# Function to setup development environment
setup_dev_environment() {
    log_info "Setting up development environment..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables
    export NODE_ENV=development
    export EXPO_DEBUG=true
    export DEBUG=1
    
    log_info "Environment variables set:"
    log_info "  NODE_ENV=$NODE_ENV"
    log_info "  EXPO_DEBUG=$EXPO_DEBUG"
    log_info "  DEBUG=$DEBUG"
    
    echo "ENV: NODE_ENV=$NODE_ENV" >> "$LOG_FILE"
    echo "ENV: EXPO_DEBUG=$EXPO_DEBUG" >> "$LOG_FILE"
    echo "ENV: DEBUG=$DEBUG" >> "$LOG_FILE"
    
    # Ensure EAS CLI is available
    if ! command -v eas &> /dev/null; then
        log_warning "EAS CLI not found globally, installing locally..."
        if npx eas --version &> /dev/null; then
            log_success "EAS CLI available via npx"
            echo "TOOL: EAS CLI via npx" >> "$LOG_FILE"
        else
            log_error "Cannot access EAS CLI"
            echo "ERROR: EAS CLI not available" >> "$LOG_FILE"
            exit 1
        fi
    else
        log_success "EAS CLI is available globally"
        echo "TOOL: EAS CLI global" >> "$LOG_FILE"
    fi
}

# Function to run prebuild if needed
run_prebuild() {
    log_info "Running Expo prebuild for native code generation..."
    
    cd "$PROJECT_ROOT"
    
    # Check if native directories exist
    local needs_prebuild=false
    
    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
        if [ ! -d "android" ]; then
            needs_prebuild=true
        fi
    fi
    
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
        if [ ! -d "ios" ]; then
            needs_prebuild=true
        fi
    fi
    
    if [ "$needs_prebuild" = true ] || [ "$CLEAN_BUILD" = true ]; then
        log_info "Running prebuild to generate native code..."
        
        # Clean existing native directories if clean build
        if [ "$CLEAN_BUILD" = true ]; then
            [ -d "android" ] && rm -rf android
            [ -d "ios" ] && rm -rf ios
        fi
        
        # Run prebuild
        if npx expo prebuild --clean; then
            log_success "Prebuild completed successfully"
            echo "PREBUILD: successful" >> "$LOG_FILE"
        else
            log_error "Prebuild failed"
            echo "ERROR: prebuild failed" >> "$LOG_FILE"
            exit 1
        fi
    else
        log_info "Native code already exists, skipping prebuild"
        echo "PREBUILD: skipped (exists)" >> "$LOG_FILE"
    fi
}

# Function to build for Android
build_android() {
    log_info "Building for Android (Development)..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Android SDK is available
    if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
        log_warning "Android SDK not found in environment, using EAS build"
        build_android_eas
        return
    fi
    
    # Try local Android build first
    log_info "Attempting local Android build..."
    
    if [ -d "android" ]; then
        cd android
        
        # Clean build
        if [ "$CLEAN_BUILD" = true ]; then
            log_info "Cleaning Android build..."
            ./gradlew clean || log_warning "Android clean failed"
        fi
        
        # Build APK
        log_info "Building Android APK..."
        if ./gradlew assembleDebug; then
            log_success "Android build completed successfully"
            
            # Find and report APK location
            local apk_path
            apk_path=$(find . -name "*.apk" -type f | head -1)
            if [ -n "$apk_path" ]; then
                log_success "APK created: $apk_path"
                echo "BUILD: Android APK at $apk_path" >> "$LOG_FILE"
            fi
        else
            log_error "Local Android build failed, falling back to EAS"
            echo "ERROR: local Android build failed" >> "$LOG_FILE"
            cd "$PROJECT_ROOT"
            build_android_eas
        fi
        
        cd "$PROJECT_ROOT"
    else
        log_warning "Android directory not found, using EAS build"
        build_android_eas
    fi
}

# Function to build Android with EAS
build_android_eas() {
    log_info "Building Android with EAS..."
    
    cd "$PROJECT_ROOT"
    
    # Build with EAS
    log_info "Starting EAS build for Android development..."
    if npx eas build --platform android --profile development --local; then
        log_success "EAS Android build completed successfully"
        echo "BUILD: EAS Android build successful" >> "$LOG_FILE"
    else
        log_error "EAS Android build failed"
        echo "ERROR: EAS Android build failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to build for iOS
build_ios() {
    log_info "Building for iOS (Development)..."
    
    cd "$PROJECT_ROOT"
    
    # Check if on macOS
    if [ "$(uname)" != "Darwin" ]; then
        log_warning "iOS builds require macOS or EAS, using EAS build"
        build_ios_eas
        return
    fi
    
    # Check if Xcode is available
    if ! command -v xcodebuild &> /dev/null; then
        log_warning "Xcode not found, using EAS build"
        build_ios_eas
        return
    fi
    
    # Try local iOS build
    log_info "Attempting local iOS build..."
    
    if [ -d "ios" ]; then
        cd ios
        
        # Install pods
        log_info "Installing CocoaPods..."
        if command -v pod &> /dev/null; then
            pod install || log_warning "Pod install failed"
        else
            log_warning "CocoaPods not found"
        fi
        
        # Build with Xcode
        log_info "Building iOS app..."
        if xcodebuild -workspace *.xcworkspace -scheme * -configuration Debug -destination generic/platform=iOS build; then
            log_success "iOS build completed successfully"
            echo "BUILD: iOS build successful" >> "$LOG_FILE"
        else
            log_error "Local iOS build failed, falling back to EAS"
            echo "ERROR: local iOS build failed" >> "$LOG_FILE"
            cd "$PROJECT_ROOT"
            build_ios_eas
        fi
        
        cd "$PROJECT_ROOT"
    else
        log_warning "iOS directory not found, using EAS build"
        build_ios_eas
    fi
}

# Function to build iOS with EAS
build_ios_eas() {
    log_info "Building iOS with EAS..."
    
    cd "$PROJECT_ROOT"
    
    # Build with EAS
    log_info "Starting EAS build for iOS development..."
    if npx eas build --platform ios --profile development --local; then
        log_success "EAS iOS build completed successfully"
        echo "BUILD: EAS iOS build successful" >> "$LOG_FILE"
    else
        log_error "EAS iOS build failed"
        echo "ERROR: EAS iOS build failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to verify build outputs
verify_build() {
    log_info "Verifying build outputs..."
    
    cd "$PROJECT_ROOT"
    
    local build_found=false
    
    # Check for Android builds
    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Checking for Android build outputs..."
        
        # Check for APK files
        if find . -name "*.apk" -type f | grep -q .; then
            log_success "Android APK found"
            find . -name "*.apk" -type f | while read -r apk; do
                log_info "APK: $apk"
                echo "OUTPUT: APK $apk" >> "$LOG_FILE"
            done
            build_found=true
        fi
        
        # Check for AAB files
        if find . -name "*.aab" -type f | grep -q .; then
            log_success "Android AAB found"
            find . -name "*.aab" -type f | while read -r aab; do
                log_info "AAB: $aab"
                echo "OUTPUT: AAB $aab" >> "$LOG_FILE"
            done
            build_found=true
        fi
    fi
    
    # Check for iOS builds
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Checking for iOS build outputs..."
        
        # Check for IPA files
        if find . -name "*.ipa" -type f | grep -q .; then
            log_success "iOS IPA found"
            find . -name "*.ipa" -type f | while read -r ipa; do
                log_info "IPA: $ipa"
                echo "OUTPUT: IPA $ipa" >> "$LOG_FILE"
            done
            build_found=true
        fi
        
        # Check for app bundles
        if find . -name "*.app" -type d | grep -q .; then
            log_success "iOS app bundle found"
            find . -name "*.app" -type d | while read -r app; do
                log_info "APP: $app"
                echo "OUTPUT: APP $app" >> "$LOG_FILE"
            done
            build_found=true
        fi
    fi
    
    if [ "$build_found" = true ]; then
        log_success "Build verification completed - outputs found"
        echo "VERIFY: build outputs found" >> "$LOG_FILE"
    else
        log_warning "No build outputs found in project directory"
        echo "WARNING: no build outputs found" >> "$LOG_FILE"
    fi
}

# Function to generate build report
generate_report() {
    log_info "Generating build report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/dev-build-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Development Build Report
==============================================

Build Date: $(date)
Build Type: $BUILD_TYPE
Platform: $PLATFORM
Clean Build: $CLEAN_BUILD

Project Information:
- Project Root: $PROJECT_ROOT
- Node.js Version: $(node --version)
- NPM Version: $(npm --version)
- Platform: $(uname -s)

Build Configuration:
- Environment: development
- Debug Mode: enabled
- Source Maps: enabled
- Minification: disabled

Build Outputs:
EOF
    
    # Add build outputs to report
    if find "$PROJECT_ROOT" -name "*.apk" -type f | grep -q .; then
        echo "" >> "$report_file"
        echo "Android APK Files:" >> "$report_file"
        find "$PROJECT_ROOT" -name "*.apk" -type f | while read -r apk; do
            echo "  - $apk ($(du -h "$apk" | cut -f1))" >> "$report_file"
        done
    fi
    
    if find "$PROJECT_ROOT" -name "*.ipa" -type f | grep -q .; then
        echo "" >> "$report_file"
        echo "iOS IPA Files:" >> "$report_file"
        find "$PROJECT_ROOT" -name "*.ipa" -type f | while read -r ipa; do
            echo "  - $ipa ($(du -h "$ipa" | cut -f1))" >> "$report_file"
        done
    fi
    
    echo "" >> "$report_file"
    echo "Build Log: $LOG_FILE" >> "$report_file"
    echo "Build completed at: $(date)" >> "$report_file"
    
    log_success "Build report generated: $report_file"
    echo "REPORT: generated at $report_file" >> "$LOG_FILE"
}

# Main build function
main() {
    log_info "=== DEVELOPMENT BUILD STARTED ==="
    log_info "Platform: $PLATFORM"
    log_info "Clean Build: $CLEAN_BUILD"
    log_info "Skip Validation: $SKIP_VALIDATION"
    
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
    
    # Clean project if requested
    if [ "$CLEAN_BUILD" = true ]; then
        clean_project
    fi
    
    # Install dependencies
    install_dependencies
    
    # Setup development environment
    setup_dev_environment
    
    # Run prebuild
    run_prebuild
    
    # Build for specified platforms
    case $PLATFORM in
        "android")
            build_android
            ;;
        "ios")
            build_ios
            ;;
        "all")
            build_android
            build_ios
            ;;
    esac
    
    # Verify build outputs
    verify_build
    
    # Generate build report
    generate_report
    
    # Success
    echo "Build completed: $(date)" >> "$LOG_FILE"
    log_success "=== DEVELOPMENT BUILD COMPLETED ==="
    log_success "Build completed successfully for platform: $PLATFORM"
    log_success "Check build report: ${PROJECT_ROOT}/scripts/build/dev-build-report.txt"
}

# Handle script interruption
trap 'log_error "Build interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main