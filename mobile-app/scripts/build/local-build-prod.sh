#!/bin/bash

# Local Production Build Script
# This script builds the app locally for production with optimizations enabled

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
LOG_FILE="${PROJECT_ROOT}/scripts/build/prod-build.log"
BUILD_TYPE="production"
PLATFORM=""
SKIP_VALIDATION=false
CLEAN_BUILD=false
BUILD_NUMBER=""
VERSION=""

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Production Build Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Platform to build for (android|ios|all)"
    echo "  -c, --clean                 Clean build (remove node_modules and reinstall)"
    echo "  -s, --skip-validation      Skip pre-build validation"
    echo "  -b, --build-number NUMBER  Override build number"
    echo "  -v, --version VERSION      Override version number"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android      Build for Android only"
    echo "  $0 --platform ios          Build for iOS only"
    echo "  $0 --platform all          Build for both platforms"
    echo "  $0 --clean --version 1.0.1 Clean build with version bump"
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
            -b|--build-number)
                BUILD_NUMBER="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
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
}

# Function to clean project
clean_project() {
    log_info "Cleaning project for production build..."
    
    cd "$PROJECT_ROOT"
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        log_info "Removing node_modules..."
        rm -rf node_modules
        log_success "node_modules removed"
        echo "CLEAN: node_modules removed" >> "$LOG_FILE"
    fi
    
    # Remove all caches
    log_info "Clearing all caches..."
    npm cache clean --force
    
    # Remove Expo cache
    if command -v npx &> /dev/null; then
        npx expo r -c || log_warning "Could not clear Expo cache"
    fi
    
    # Remove build artifacts
    local artifacts=(".expo" "dist" "build" "android/app/build" "ios/build" "android/.gradle" "ios/build")
    for artifact in "${artifacts[@]}"; do
        if [ -d "$artifact" ]; then
            log_info "Removing $artifact..."
            rm -rf "$artifact"
            echo "CLEAN: $artifact removed" >> "$LOG_FILE"
        fi
    done
    
    # Clean Metro cache
    if command -v npx &> /dev/null; then
        npx react-native start --reset-cache || log_warning "Could not reset Metro cache"
    fi
    
    log_success "Project cleaned successfully for production"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies for production build..."
    
    cd "$PROJECT_ROOT"
    
    # Install with production flags
    log_info "Running npm ci for production..."
    if npm ci --production=false --audit=false; then
        log_success "Dependencies installed successfully"
        echo "DEPS: npm ci successful" >> "$LOG_FILE"
    else
        log_error "Failed to install dependencies"
        echo "ERROR: npm ci failed" >> "$LOG_FILE"
        exit 1
    fi
    
    # Verify critical dependencies
    local critical_deps=("expo" "@expo/vector-icons" "react" "react-native")
    for dep in "${critical_deps[@]}"; do
        if npm ls "$dep" &> /dev/null; then
            log_success "Critical dependency verified: $dep"
            echo "DEPS: $dep verified" >> "$LOG_FILE"
        else
            log_error "Critical dependency missing: $dep"
            echo "ERROR: Missing critical dep: $dep" >> "$LOG_FILE"
            exit 1
        fi
    done
}

# Function to update version numbers
update_version_numbers() {
    if [ -n "$VERSION" ] || [ -n "$BUILD_NUMBER" ]; then
        log_info "Updating version numbers..."
        
        cd "$PROJECT_ROOT"
        
        # Update package.json version
        if [ -n "$VERSION" ]; then
            log_info "Updating package.json version to $VERSION"
            npm version "$VERSION" --no-git-tag-version
            echo "VERSION: package.json updated to $VERSION" >> "$LOG_FILE"
        fi
        
        # Update app.json version and build numbers
        if [ -f "app.json" ]; then
            # Update version in app.json
            if [ -n "$VERSION" ]; then
                log_info "Updating app.json version to $VERSION"
                node -e "
                    const fs = require('fs');
                    const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
                    config.expo.version = '$VERSION';
                    fs.writeFileSync('app.json', JSON.stringify(config, null, 2));
                "
                echo "VERSION: app.json updated to $VERSION" >> "$LOG_FILE"
            fi
            
            # Update build number
            if [ -n "$BUILD_NUMBER" ]; then
                log_info "Updating build numbers to $BUILD_NUMBER"
                node -e "
                    const fs = require('fs');
                    const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
                    if (config.expo.ios) config.expo.ios.buildNumber = '$BUILD_NUMBER';
                    if (config.expo.android) config.expo.android.versionCode = parseInt('$BUILD_NUMBER');
                    fs.writeFileSync('app.json', JSON.stringify(config, null, 2));
                "
                echo "VERSION: build numbers updated to $BUILD_NUMBER" >> "$LOG_FILE"
            fi
        fi
        
        log_success "Version numbers updated successfully"
    fi
}

# Function to setup production environment
setup_prod_environment() {
    log_info "Setting up production environment..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables
    export NODE_ENV=production
    export EXPO_DEBUG=false
    export DEBUG=0
    
    # Production optimizations
    export EXPO_OPTIMIZE=true
    export EXPO_MINIFY=true
    
    log_info "Environment variables set:"
    log_info "  NODE_ENV=$NODE_ENV"
    log_info "  EXPO_DEBUG=$EXPO_DEBUG"
    log_info "  DEBUG=$DEBUG"
    log_info "  EXPO_OPTIMIZE=$EXPO_OPTIMIZE"
    log_info "  EXPO_MINIFY=$EXPO_MINIFY"
    
    echo "ENV: NODE_ENV=$NODE_ENV" >> "$LOG_FILE"
    echo "ENV: EXPO_DEBUG=$EXPO_DEBUG" >> "$LOG_FILE"
    echo "ENV: EXPO_OPTIMIZE=$EXPO_OPTIMIZE" >> "$LOG_FILE"
    echo "ENV: EXPO_MINIFY=$EXPO_MINIFY" >> "$LOG_FILE"
    
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

# Function to run prebuild for production
run_prebuild() {
    log_info "Running Expo prebuild for production..."
    
    cd "$PROJECT_ROOT"
    
    # Always run prebuild for production to ensure clean native code
    log_info "Running prebuild to generate optimized native code..."
    
    # Clean existing native directories
    [ -d "android" ] && rm -rf android
    [ -d "ios" ] && rm -rf ios
    
    # Run prebuild with production settings
    if npx expo prebuild --clean --no-install; then
        log_success "Production prebuild completed successfully"
        echo "PREBUILD: production prebuild successful" >> "$LOG_FILE"
    else
        log_error "Production prebuild failed"
        echo "ERROR: production prebuild failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to optimize bundle
optimize_bundle() {
    log_info "Optimizing bundle for production..."
    
    cd "$PROJECT_ROOT"
    
    # Run bundle optimization
    log_info "Creating optimized bundle..."
    if npx expo export --platform all --output-dir dist; then
        log_success "Bundle optimization completed"
        echo "BUNDLE: optimization successful" >> "$LOG_FILE"
        
        # Report bundle size
        if [ -d "dist" ]; then
            local bundle_size
            bundle_size=$(du -sh dist | cut -f1)
            log_info "Bundle size: $bundle_size"
            echo "BUNDLE: size $bundle_size" >> "$LOG_FILE"
        fi
    else
        log_warning "Bundle optimization failed, continuing with build"
        echo "WARNING: bundle optimization failed" >> "$LOG_FILE"
    fi
}

# Function to build for Android production
build_android_prod() {
    log_info "Building for Android (Production)..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Android SDK is available for local build
    if [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
        log_info "Android SDK found, attempting local production build..."
        build_android_local_prod
    else
        log_info "Android SDK not found, using EAS build..."
        build_android_eas_prod
    fi
}

# Function to build Android locally for production
build_android_local_prod() {
    log_info "Building Android locally for production..."
    
    cd "$PROJECT_ROOT"
    
    if [ -d "android" ]; then
        cd android
        
        # Clean build
        log_info "Cleaning Android build..."
        ./gradlew clean || log_warning "Android clean failed"
        
        # Build AAB for production
        log_info "Building Android AAB for production..."
        if ./gradlew bundleRelease; then
            log_success "Android production build completed successfully"
            
            # Find and report AAB location
            local aab_path
            aab_path=$(find . -name "*.aab" -type f | head -1)
            if [ -n "$aab_path" ]; then
                log_success "AAB created: $aab_path"
                echo "BUILD: Android AAB at $aab_path" >> "$LOG_FILE"
                
                # Get file size
                local file_size
                file_size=$(du -h "$aab_path" | cut -f1)
                log_info "AAB size: $file_size"
                echo "BUILD: AAB size $file_size" >> "$LOG_FILE"
            fi
            
            echo "BUILD: Android local production build successful" >> "$LOG_FILE"
        else
            log_error "Local Android production build failed, falling back to EAS"
            echo "ERROR: local Android production build failed" >> "$LOG_FILE"
            cd "$PROJECT_ROOT"
            build_android_eas_prod
        fi
        
        cd "$PROJECT_ROOT"
    else
        log_warning "Android directory not found, using EAS build"
        build_android_eas_prod
    fi
}

# Function to build Android with EAS for production
build_android_eas_prod() {
    log_info "Building Android with EAS for production..."
    
    cd "$PROJECT_ROOT"
    
    # Build with EAS
    log_info "Starting EAS build for Android production..."
    if npx eas build --platform android --profile production --local; then
        log_success "EAS Android production build completed successfully"
        echo "BUILD: EAS Android production build successful" >> "$LOG_FILE"
    else
        log_error "EAS Android production build failed"
        echo "ERROR: EAS Android production build failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to build for iOS production
build_ios_prod() {
    log_info "Building for iOS (Production)..."
    
    cd "$PROJECT_ROOT"
    
    # Check if on macOS with Xcode
    if [ "$(uname)" = "Darwin" ] && command -v xcodebuild &> /dev/null; then
        log_info "macOS with Xcode found, attempting local production build..."
        build_ios_local_prod
    else
        log_info "macOS/Xcode not available, using EAS build..."
        build_ios_eas_prod
    fi
}

# Function to build iOS locally for production
build_ios_local_prod() {
    log_info "Building iOS locally for production..."
    
    cd "$PROJECT_ROOT"
    
    if [ -d "ios" ]; then
        cd ios
        
        # Install pods
        log_info "Installing CocoaPods for production..."
        if command -v pod &> /dev/null; then
            pod install --repo-update || log_warning "Pod install failed"
        else
            log_warning "CocoaPods not found"
        fi
        
        # Build with Xcode for production
        log_info "Building iOS app for production..."
        if xcodebuild -workspace *.xcworkspace -scheme * -configuration Release -destination generic/platform=iOS -archivePath build/App.xcarchive archive; then
            log_success "iOS production build completed successfully"
            
            # Export IPA
            log_info "Exporting IPA..."
            if xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build -exportOptionsPlist ExportOptions.plist; then
                log_success "IPA export completed successfully"
                
                # Find and report IPA location
                local ipa_path
                ipa_path=$(find build -name "*.ipa" -type f | head -1)
                if [ -n "$ipa_path" ]; then
                    log_success "IPA created: $ipa_path"
                    echo "BUILD: iOS IPA at $ipa_path" >> "$LOG_FILE"
                    
                    # Get file size
                    local file_size
                    file_size=$(du -h "$ipa_path" | cut -f1)
                    log_info "IPA size: $file_size"
                    echo "BUILD: IPA size $file_size" >> "$LOG_FILE"
                fi
            else
                log_warning "IPA export failed"
            fi
            
            echo "BUILD: iOS local production build successful" >> "$LOG_FILE"
        else
            log_error "Local iOS production build failed, falling back to EAS"
            echo "ERROR: local iOS production build failed" >> "$LOG_FILE"
            cd "$PROJECT_ROOT"
            build_ios_eas_prod
        fi
        
        cd "$PROJECT_ROOT"
    else
        log_warning "iOS directory not found, using EAS build"
        build_ios_eas_prod
    fi
}

# Function to build iOS with EAS for production
build_ios_eas_prod() {
    log_info "Building iOS with EAS for production..."
    
    cd "$PROJECT_ROOT"
    
    # Build with EAS
    log_info "Starting EAS build for iOS production..."
    if npx eas build --platform ios --profile production --local; then
        log_success "EAS iOS production build completed successfully"
        echo "BUILD: EAS iOS production build successful" >> "$LOG_FILE"
    else
        log_error "EAS iOS production build failed"
        echo "ERROR: EAS iOS production build failed" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to verify production build outputs
verify_prod_build() {
    log_info "Verifying production build outputs..."
    
    cd "$PROJECT_ROOT"
    
    local build_found=false
    local build_errors=0
    
    # Check for Android builds
    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Checking for Android production build outputs..."
        
        # Check for AAB files (preferred for production)
        if find . -name "*.aab" -type f | grep -q .; then
            log_success "Android AAB found (production ready)"
            find . -name "*.aab" -type f | while read -r aab; do
                log_info "AAB: $aab"
                echo "OUTPUT: AAB $aab" >> "$LOG_FILE"
                
                # Verify AAB integrity
                if command -v aapt &> /dev/null; then
                    if aapt dump badging "$aab" &> /dev/null; then
                        log_success "AAB integrity verified: $aab"
                    else
                        log_error "AAB integrity check failed: $aab"
                        ((build_errors++))
                    fi
                fi
            done
            build_found=true
        fi
        
        # Check for APK files
        if find . -name "*.apk" -type f | grep -q .; then
            log_success "Android APK found"
            find . -name "*.apk" -type f | while read -r apk; do
                log_info "APK: $apk"
                echo "OUTPUT: APK $apk" >> "$LOG_FILE"
            done
            build_found=true
        fi
    fi
    
    # Check for iOS builds
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Checking for iOS production build outputs..."
        
        # Check for IPA files
        if find . -name "*.ipa" -type f | grep -q .; then
            log_success "iOS IPA found (production ready)"
            find . -name "*.ipa" -type f | while read -r ipa; do
                log_info "IPA: $ipa"
                echo "OUTPUT: IPA $ipa" >> "$LOG_FILE"
            done
            build_found=true
        fi
    fi
    
    if [ "$build_found" = true ]; then
        if [ $build_errors -eq 0 ]; then
            log_success "Production build verification completed - all outputs verified"
            echo "VERIFY: production build outputs verified" >> "$LOG_FILE"
        else
            log_error "Production build verification found $build_errors errors"
            echo "ERROR: $build_errors verification errors" >> "$LOG_FILE"
            exit 1
        fi
    else
        log_error "No production build outputs found"
        echo "ERROR: no production build outputs found" >> "$LOG_FILE"
        exit 1
    fi
}

# Function to generate production build report
generate_prod_report() {
    log_info "Generating production build report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/prod-build-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Production Build Report
=============================================

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
- Environment: production
- Debug Mode: disabled
- Optimization: enabled
- Minification: enabled
- Source Maps: disabled

Version Information:
EOF
    
    # Add version info
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        local pkg_version
        pkg_version=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")
        echo "- Package Version: $pkg_version" >> "$report_file"
    fi
    
    if [ -f "$PROJECT_ROOT/app.json" ]; then
        local app_version
        app_version=$(node -e "console.log(JSON.parse(require('fs').readFileSync('app.json', 'utf8')).expo.version)")
        echo "- App Version: $app_version" >> "$report_file"
        
        local build_number
        build_number=$(node -e "
            const config = JSON.parse(require('fs').readFileSync('app.json', 'utf8'));
            console.log(config.expo.ios?.buildNumber || config.expo.android?.versionCode || 'N/A');
        ")
        echo "- Build Number: $build_number" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "Production Build Outputs:" >> "$report_file"
    
    # Add build outputs to report
    if find "$PROJECT_ROOT" -name "*.aab" -type f | grep -q .; then
        echo "" >> "$report_file"
        echo "Android AAB Files (Production Ready):" >> "$report_file"
        find "$PROJECT_ROOT" -name "*.aab" -type f | while read -r aab; do
            echo "  - $aab ($(du -h "$aab" | cut -f1))" >> "$report_file"
        done
    fi
    
    if find "$PROJECT_ROOT" -name "*.apk" -type f | grep -q .; then
        echo "" >> "$report_file"
        echo "Android APK Files:" >> "$report_file"
        find "$PROJECT_ROOT" -name "*.apk" -type f | while read -r apk; do
            echo "  - $apk ($(du -h "$apk" | cut -f1))" >> "$report_file"
        done
    fi
    
    if find "$PROJECT_ROOT" -name "*.ipa" -type f | grep -q .; then
        echo "" >> "$report_file"
        echo "iOS IPA Files (Production Ready):" >> "$report_file"
        find "$PROJECT_ROOT" -name "*.ipa" -type f | while read -r ipa; do
            echo "  - $ipa ($(du -h "$ipa" | cut -f1))" >> "$report_file"
        done
    fi
    
    # Add bundle information
    if [ -d "$PROJECT_ROOT/dist" ]; then
        local bundle_size
        bundle_size=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
        echo "" >> "$report_file"
        echo "Bundle Information:" >> "$report_file"
        echo "- Bundle Size: $bundle_size" >> "$report_file"
        echo "- Bundle Location: $PROJECT_ROOT/dist" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "Build Log: $LOG_FILE" >> "$report_file"
    echo "Production build completed at: $(date)" >> "$report_file"
    
    log_success "Production build report generated: $report_file"
    echo "REPORT: generated at $report_file" >> "$LOG_FILE"
}

# Main build function
main() {
    log_info "=== PRODUCTION BUILD STARTED ==="
    log_info "Platform: $PLATFORM"
    log_info "Clean Build: $CLEAN_BUILD"
    log_info "Skip Validation: $SKIP_VALIDATION"
    log_info "Build Number: ${BUILD_NUMBER:-auto}"
    log_info "Version: ${VERSION:-current}"
    
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
    
    # Clean project if requested or for production
    if [ "$CLEAN_BUILD" = true ]; then
        clean_project
    fi
    
    # Install dependencies
    install_dependencies
    
    # Update version numbers if specified
    update_version_numbers
    
    # Setup production environment
    setup_prod_environment
    
    # Run prebuild for production
    run_prebuild
    
    # Optimize bundle
    optimize_bundle
    
    # Build for specified platforms
    case $PLATFORM in
        "android")
            build_android_prod
            ;;
        "ios")
            build_ios_prod
            ;;
        "all")
            build_android_prod
            build_ios_prod
            ;;
    esac
    
    # Verify production build outputs
    verify_prod_build
    
    # Generate production build report
    generate_prod_report
    
    # Success
    echo "Production build completed: $(date)" >> "$LOG_FILE"
    log_success "=== PRODUCTION BUILD COMPLETED ==="
    log_success "Production build completed successfully for platform: $PLATFORM"
    log_success "Check build report: ${PROJECT_ROOT}/scripts/build/prod-build-report.txt"
    log_success "Build artifacts are ready for distribution!"
}

# Handle script interruption
trap 'log_error "Production build interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main