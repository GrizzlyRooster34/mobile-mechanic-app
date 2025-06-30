#!/bin/bash

# Post-build Verification Script
# This script verifies build outputs, checks app functionality, and generates build reports

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
LOG_FILE="${PROJECT_ROOT}/scripts/build/verification.log"
PLATFORM=""
BUILD_TYPE=""
DEEP_VERIFICATION=false
PERFORMANCE_CHECK=false
SECURITY_SCAN=false

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Post-build Verification Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Platform to verify (android|ios|all)"
    echo "  -t, --type TYPE            Build type (development|production)"
    echo "  -d, --deep                 Perform deep verification (APK/IPA analysis)"
    echo "  -f, --performance          Run performance checks"
    echo "  -s, --security             Run security scans"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android --type production --deep"
    echo "  $0 --platform all --performance --security"
    echo "  $0 --platform ios --type development"
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
            -t|--type)
                BUILD_TYPE="$2"
                shift 2
                ;;
            -d|--deep)
                DEEP_VERIFICATION=true
                shift
                ;;
            -f|--performance)
                PERFORMANCE_CHECK=true
                shift
                ;;
            -s|--security)
                SECURITY_SCAN=true
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
    
    # Default build type to production if not specified
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

# Function to find build artifacts
find_build_artifacts() {
    log_info "Scanning for build artifacts..."
    
    cd "$PROJECT_ROOT"
    
    local artifacts_found=()
    
    # Search for Android artifacts
    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Searching for Android build artifacts..."
        
        # Find APK files
        while IFS= read -r -d '' apk; do
            artifacts_found+=("$apk")
            log_success "Found Android APK: $apk"
            echo "ARTIFACT: Android APK $apk" >> "$LOG_FILE"
        done < <(find . -name "*.apk" -type f -print0 2>/dev/null)
        
        # Find AAB files
        while IFS= read -r -d '' aab; do
            artifacts_found+=("$aab")
            log_success "Found Android AAB: $aab"
            echo "ARTIFACT: Android AAB $aab" >> "$LOG_FILE"
        done < <(find . -name "*.aab" -type f -print0 2>/dev/null)
    fi
    
    # Search for iOS artifacts
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
        log_info "Searching for iOS build artifacts..."
        
        # Find IPA files
        while IFS= read -r -d '' ipa; do
            artifacts_found+=("$ipa")
            log_success "Found iOS IPA: $ipa"
            echo "ARTIFACT: iOS IPA $ipa" >> "$LOG_FILE"
        done < <(find . -name "*.ipa" -type f -print0 2>/dev/null)
        
        # Find APP bundles
        while IFS= read -r -d '' app; do
            artifacts_found+=("$app")
            log_success "Found iOS APP: $app"
            echo "ARTIFACT: iOS APP $app" >> "$LOG_FILE"
        done < <(find . -name "*.app" -type d -print0 2>/dev/null)
    fi
    
    # Export artifacts array for other functions
    printf '%s\n' "${artifacts_found[@]}" > "${PROJECT_ROOT}/scripts/build/artifacts.list"
    
    if [ ${#artifacts_found[@]} -eq 0 ]; then
        log_error "No build artifacts found!"
        echo "ERROR: no artifacts found" >> "$LOG_FILE"
        return 1
    else
        log_success "Found ${#artifacts_found[@]} build artifacts"
        echo "SCAN: found ${#artifacts_found[@]} artifacts" >> "$LOG_FILE"
        return 0
    fi
}

# Function to verify artifact integrity
verify_artifact_integrity() {
    local artifact=$1
    
    log_info "Verifying integrity of: $(basename "$artifact")"
    
    # Check file exists and is not empty
    if [ ! -f "$artifact" ] || [ ! -s "$artifact" ]; then
        log_error "Artifact is missing or empty: $artifact"
        echo "ERROR: artifact missing or empty: $artifact" >> "$LOG_FILE"
        return 1
    fi
    
    # Get file size
    local file_size
    file_size=$(du -h "$artifact" | cut -f1)
    log_info "Artifact size: $file_size"
    echo "INTEGRITY: $artifact size $file_size" >> "$LOG_FILE"
    
    # Verify file type based on extension
    local extension="${artifact##*.}"
    case $extension in
        "apk")
            verify_apk_integrity "$artifact"
            ;;
        "aab")
            verify_aab_integrity "$artifact"
            ;;
        "ipa")
            verify_ipa_integrity "$artifact"
            ;;
        "app")
            verify_app_bundle_integrity "$artifact"
            ;;
        *)
            log_warning "Unknown artifact type: $extension"
            echo "WARNING: unknown artifact type: $extension" >> "$LOG_FILE"
            ;;
    esac
}

# Function to verify APK integrity
verify_apk_integrity() {
    local apk=$1
    
    log_info "Verifying APK integrity: $(basename "$apk")"
    
    # Check if aapt is available
    if command -v aapt &> /dev/null; then
        log_info "Using aapt to verify APK..."
        
        # Get APK info
        if aapt dump badging "$apk" > /dev/null 2>&1; then
            log_success "APK structure is valid"
            echo "INTEGRITY: APK structure valid: $apk" >> "$LOG_FILE"
            
            # Extract package info
            local package_name
            local version_name
            local version_code
            
            package_name=$(aapt dump badging "$apk" | grep "package:" | sed -n "s/.*name='\([^']*\)'.*/\1/p")
            version_name=$(aapt dump badging "$apk" | grep "package:" | sed -n "s/.*versionName='\([^']*\)'.*/\1/p")
            version_code=$(aapt dump badging "$apk" | grep "package:" | sed -n "s/.*versionCode='\([^']*\)'.*/\1/p")
            
            log_info "Package: $package_name"
            log_info "Version: $version_name ($version_code)"
            echo "INTEGRITY: APK package $package_name v$version_name ($version_code)" >> "$LOG_FILE"
            
            # Check for required permissions
            local permissions
            permissions=$(aapt dump badging "$apk" | grep "uses-permission" | wc -l)
            log_info "Permissions declared: $permissions"
            echo "INTEGRITY: APK permissions $permissions" >> "$LOG_FILE"
            
        else
            log_error "APK structure validation failed"
            echo "ERROR: APK structure invalid: $apk" >> "$LOG_FILE"
            return 1
        fi
    else
        log_warning "aapt not available, using basic file verification"
        
        # Basic ZIP verification (APK is a ZIP file)
        if unzip -t "$apk" > /dev/null 2>&1; then
            log_success "APK ZIP structure is valid"
            echo "INTEGRITY: APK ZIP valid: $apk" >> "$LOG_FILE"
        else
            log_error "APK ZIP structure is corrupted"
            echo "ERROR: APK ZIP corrupted: $apk" >> "$LOG_FILE"
            return 1
        fi
    fi
}

# Function to verify AAB integrity
verify_aab_integrity() {
    local aab=$1
    
    log_info "Verifying AAB integrity: $(basename "$aab")"
    
    # AAB is also a ZIP file
    if unzip -t "$aab" > /dev/null 2>&1; then
        log_success "AAB ZIP structure is valid"
        echo "INTEGRITY: AAB ZIP valid: $aab" >> "$LOG_FILE"
        
        # Check for required AAB files
        local required_files=("BundleConfig.pb" "base/manifest/AndroidManifest.xml")
        for required_file in "${required_files[@]}"; do
            if unzip -l "$aab" | grep -q "$required_file"; then
                log_success "Required AAB file found: $required_file"
                echo "INTEGRITY: AAB file found: $required_file" >> "$LOG_FILE"
            else
                log_error "Required AAB file missing: $required_file"
                echo "ERROR: AAB file missing: $required_file" >> "$LOG_FILE"
                return 1
            fi
        done
    else
        log_error "AAB ZIP structure is corrupted"
        echo "ERROR: AAB ZIP corrupted: $aab" >> "$LOG_FILE"
        return 1
    fi
}

# Function to verify IPA integrity
verify_ipa_integrity() {
    local ipa=$1
    
    log_info "Verifying IPA integrity: $(basename "$ipa")"
    
    # IPA is a ZIP file
    if unzip -t "$ipa" > /dev/null 2>&1; then
        log_success "IPA ZIP structure is valid"
        echo "INTEGRITY: IPA ZIP valid: $ipa" >> "$LOG_FILE"
        
        # Check for required IPA structure
        if unzip -l "$ipa" | grep -q "Payload/.*\.app/"; then
            log_success "IPA contains app bundle"
            echo "INTEGRITY: IPA app bundle found" >> "$LOG_FILE"
            
            # Extract app name
            local app_name
            app_name=$(unzip -l "$ipa" | grep "Payload/.*\.app/" | head -1 | sed -n 's/.*Payload\/\(.*\)\.app\/.*/\1/p')
            if [ -n "$app_name" ]; then
                log_info "App name: $app_name"
                echo "INTEGRITY: IPA app name $app_name" >> "$LOG_FILE"
            fi
        else
            log_error "IPA does not contain app bundle"
            echo "ERROR: IPA missing app bundle" >> "$LOG_FILE"
            return 1
        fi
    else
        log_error "IPA ZIP structure is corrupted"
        echo "ERROR: IPA ZIP corrupted: $ipa" >> "$LOG_FILE"
        return 1
    fi
}

# Function to verify app bundle integrity
verify_app_bundle_integrity() {
    local app_bundle=$1
    
    log_info "Verifying app bundle integrity: $(basename "$app_bundle")"
    
    # Check if it's a directory
    if [ -d "$app_bundle" ]; then
        log_success "App bundle is a valid directory"
        echo "INTEGRITY: App bundle directory valid: $app_bundle" >> "$LOG_FILE"
        
        # Check for required files
        local required_files=("Info.plist")
        for required_file in "${required_files[@]}"; do
            if [ -f "$app_bundle/$required_file" ]; then
                log_success "Required file found: $required_file"
                echo "INTEGRITY: App bundle file found: $required_file" >> "$LOG_FILE"
            else
                log_error "Required file missing: $required_file"
                echo "ERROR: App bundle file missing: $required_file" >> "$LOG_FILE"
                return 1
            fi
        done
        
        # Check executable
        local app_name
        app_name=$(basename "$app_bundle" .app)
        if [ -x "$app_bundle/$app_name" ]; then
            log_success "App executable found and is executable"
            echo "INTEGRITY: App executable OK" >> "$LOG_FILE"
        else
            log_warning "App executable not found or not executable"
            echo "WARNING: App executable issues" >> "$LOG_FILE"
        fi
    else
        log_error "App bundle is not a directory"
        echo "ERROR: App bundle not directory: $app_bundle" >> "$LOG_FILE"
        return 1
    fi
}

# Function to perform deep verification
perform_deep_verification() {
    local artifact=$1
    
    log_info "Performing deep verification of: $(basename "$artifact")"
    
    local extension="${artifact##*.}"
    case $extension in
        "apk"|"aab")
            deep_verify_android "$artifact"
            ;;
        "ipa"|"app")
            deep_verify_ios "$artifact"
            ;;
        *)
            log_warning "Deep verification not supported for: $extension"
            echo "WARNING: deep verification not supported: $extension" >> "$LOG_FILE"
            ;;
    esac
}

# Function to deep verify Android artifacts
deep_verify_android() {
    local artifact=$1
    
    log_info "Deep verifying Android artifact: $(basename "$artifact")"
    
    # Create temporary extraction directory
    local temp_dir
    temp_dir=$(mktemp -d)
    
    # Extract artifact
    if unzip -q "$artifact" -d "$temp_dir"; then
        log_success "Android artifact extracted for analysis"
        echo "DEEP: Android artifact extracted" >> "$LOG_FILE"
        
        # Analyze manifest
        if [ -f "$temp_dir/AndroidManifest.xml" ]; then
            log_info "Analyzing AndroidManifest.xml..."
            
            # Check for binary manifest (needs aapt to decode)
            if command -v aapt &> /dev/null; then
                aapt dump xmltree "$artifact" AndroidManifest.xml > "$temp_dir/manifest_decoded.xml" 2>/dev/null || true
            fi
            
            echo "DEEP: Android manifest analyzed" >> "$LOG_FILE"
        fi
        
        # Check for native libraries
        if [ -d "$temp_dir/lib" ]; then
            local arch_count
            arch_count=$(find "$temp_dir/lib" -mindepth 1 -maxdepth 1 -type d | wc -l)
            log_info "Native libraries found for $arch_count architectures"
            echo "DEEP: Android native libs for $arch_count architectures" >> "$LOG_FILE"
        fi
        
        # Check for assets
        if [ -d "$temp_dir/assets" ]; then
            local asset_count
            asset_count=$(find "$temp_dir/assets" -type f | wc -l)
            log_info "Assets found: $asset_count files"
            echo "DEEP: Android assets $asset_count files" >> "$LOG_FILE"
        fi
        
        # Check for resources
        if [ -f "$temp_dir/resources.arsc" ]; then
            local resource_size
            resource_size=$(du -h "$temp_dir/resources.arsc" | cut -f1)
            log_info "Resources file size: $resource_size"
            echo "DEEP: Android resources $resource_size" >> "$LOG_FILE"
        fi
        
        # Check for DEX files
        local dex_count
        dex_count=$(find "$temp_dir" -name "*.dex" | wc -l)
        if [ $dex_count -gt 0 ]; then
            log_info "DEX files found: $dex_count"
            echo "DEEP: Android DEX files $dex_count" >> "$LOG_FILE"
        fi
        
        log_success "Deep Android verification completed"
    else
        log_error "Failed to extract Android artifact for deep verification"
        echo "ERROR: Android artifact extraction failed" >> "$LOG_FILE"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Function to deep verify iOS artifacts  
deep_verify_ios() {
    local artifact=$1
    
    log_info "Deep verifying iOS artifact: $(basename "$artifact")"
    
    local temp_dir
    temp_dir=$(mktemp -d)
    
    if [[ "$artifact" == *.ipa ]]; then
        # Extract IPA
        if unzip -q "$artifact" -d "$temp_dir"; then
            log_success "IPA extracted for analysis"
            echo "DEEP: IPA extracted" >> "$LOG_FILE"
            
            # Find app bundle in Payload
            local app_bundle
            app_bundle=$(find "$temp_dir/Payload" -name "*.app" -type d | head -1)
            
            if [ -n "$app_bundle" ]; then
                deep_analyze_ios_app "$app_bundle"
            fi
        else
            log_error "Failed to extract IPA for deep verification"
            echo "ERROR: IPA extraction failed" >> "$LOG_FILE"
        fi
    elif [[ "$artifact" == *.app ]]; then
        # Direct app bundle
        deep_analyze_ios_app "$artifact"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Function to analyze iOS app bundle
deep_analyze_ios_app() {
    local app_bundle=$1
    
    log_info "Analyzing iOS app bundle: $(basename "$app_bundle")"
    
    # Check Info.plist
    if [ -f "$app_bundle/Info.plist" ]; then
        log_info "Analyzing Info.plist..."
        
        # Extract basic info (requires plutil on macOS)
        if command -v plutil &> /dev/null; then
            local bundle_id
            local version
            bundle_id=$(plutil -extract CFBundleIdentifier raw "$app_bundle/Info.plist" 2>/dev/null || echo "unknown")
            version=$(plutil -extract CFBundleShortVersionString raw "$app_bundle/Info.plist" 2>/dev/null || echo "unknown")
            
            log_info "Bundle ID: $bundle_id"
            log_info "Version: $version"
            echo "DEEP: iOS bundle ID $bundle_id version $version" >> "$LOG_FILE"
        fi
        
        echo "DEEP: iOS Info.plist analyzed" >> "$LOG_FILE"
    fi
    
    # Check for frameworks
    if [ -d "$app_bundle/Frameworks" ]; then
        local framework_count
        framework_count=$(find "$app_bundle/Frameworks" -name "*.framework" -type d | wc -l)
        log_info "Embedded frameworks: $framework_count"
        echo "DEEP: iOS frameworks $framework_count" >> "$LOG_FILE"
    fi
    
    # Check for assets
    if [ -d "$app_bundle/_CodeSignature" ]; then
        log_success "Code signature found"
        echo "DEEP: iOS code signature present" >> "$LOG_FILE"
    else
        log_warning "No code signature found"
        echo "WARNING: iOS no code signature" >> "$LOG_FILE"
    fi
    
    log_success "Deep iOS verification completed"
}

# Function to run performance checks
run_performance_checks() {
    log_info "Running performance checks..."
    
    # Check file sizes
    while IFS= read -r artifact; do
        if [ -f "$artifact" ]; then
            local file_size_bytes
            local file_size_mb
            
            file_size_bytes=$(stat -f%z "$artifact" 2>/dev/null || stat -c%s "$artifact" 2>/dev/null || echo "0")
            file_size_mb=$((file_size_bytes / 1024 / 1024))
            
            log_info "$(basename "$artifact"): ${file_size_mb}MB"
            echo "PERFORMANCE: $(basename "$artifact") ${file_size_mb}MB" >> "$LOG_FILE"
            
            # Check size thresholds
            local extension="${artifact##*.}"
            case $extension in
                "apk"|"aab")
                    if [ $file_size_mb -gt 100 ]; then
                        log_warning "Android app size is large: ${file_size_mb}MB (recommended < 100MB)"
                        echo "WARNING: Android app size large ${file_size_mb}MB" >> "$LOG_FILE"
                    else
                        log_success "Android app size is acceptable: ${file_size_mb}MB"
                    fi
                    ;;
                "ipa")
                    if [ $file_size_mb -gt 200 ]; then
                        log_warning "iOS app size is large: ${file_size_mb}MB (recommended < 200MB)"
                        echo "WARNING: iOS app size large ${file_size_mb}MB" >> "$LOG_FILE"
                    else
                        log_success "iOS app size is acceptable: ${file_size_mb}MB"
                    fi
                    ;;
            esac
        fi
    done < "${PROJECT_ROOT}/scripts/build/artifacts.list"
    
    log_success "Performance checks completed"
}

# Function to run security scans
run_security_scans() {
    log_info "Running security scans..."
    
    # Basic security checks
    while IFS= read -r artifact; do
        if [ -f "$artifact" ]; then
            log_info "Security scanning: $(basename "$artifact")"
            
            local extension="${artifact##*.}"
            case $extension in
                "apk"|"aab")
                    security_scan_android "$artifact"
                    ;;
                "ipa"|"app")
                    security_scan_ios "$artifact"
                    ;;
            esac
        fi
    done < "${PROJECT_ROOT}/scripts/build/artifacts.list"
    
    log_success "Security scans completed"
}

# Function to scan Android artifacts for security issues
security_scan_android() {
    local artifact=$1
    
    log_info "Security scanning Android artifact: $(basename "$artifact")"
    
    # Check for debug signatures (development builds should have them, production shouldn't)
    if aapt dump badging "$artifact" 2>/dev/null | grep -q "application-debuggable"; then
        if [ "$BUILD_TYPE" = "production" ]; then
            log_warning "Production APK has debug flag enabled"
            echo "WARNING: Android debug flag in production" >> "$LOG_FILE"
        else
            log_info "Debug flag present (expected for development build)"
            echo "SECURITY: Android debug flag OK for development" >> "$LOG_FILE"
        fi
    fi
    
    # Check for dangerous permissions
    local dangerous_perms=("WRITE_EXTERNAL_STORAGE" "READ_EXTERNAL_STORAGE" "CAMERA" "RECORD_AUDIO" "ACCESS_FINE_LOCATION")
    for perm in "${dangerous_perms[@]}"; do
        if aapt dump badging "$artifact" 2>/dev/null | grep -q "uses-permission.*$perm"; then
            log_info "Dangerous permission found: $perm"
            echo "SECURITY: Android permission $perm" >> "$LOG_FILE"
        fi
    done
    
    echo "SECURITY: Android scan completed for $(basename "$artifact")" >> "$LOG_FILE"
}

# Function to scan iOS artifacts for security issues
security_scan_ios() {
    local artifact=$1
    
    log_info "Security scanning iOS artifact: $(basename "$artifact")"
    
    # Basic iOS security checks would go here
    # This is limited without proper iOS analysis tools
    
    echo "SECURITY: iOS scan completed for $(basename "$artifact")" >> "$LOG_FILE"
}

# Function to generate comprehensive verification report
generate_verification_report() {
    log_info "Generating comprehensive verification report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/verification-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Post-Build Verification Report
===================================================

Verification Date: $(date)
Platform: $PLATFORM
Build Type: $BUILD_TYPE
Deep Verification: $DEEP_VERIFICATION
Performance Check: $PERFORMANCE_CHECK
Security Scan: $SECURITY_SCAN

Project Information:
- Project Root: $PROJECT_ROOT
- Verification Script: $0

Build Artifacts Found:
EOF
    
    # Add artifacts to report
    if [ -f "${PROJECT_ROOT}/scripts/build/artifacts.list" ]; then
        while IFS= read -r artifact; do
            if [ -f "$artifact" ]; then
                local file_size
                file_size=$(du -h "$artifact" | cut -f1)
                echo "- $(basename "$artifact") ($file_size) at $artifact" >> "$report_file"
            fi
        done < "${PROJECT_ROOT}/scripts/build/artifacts.list"
    fi
    
    echo "" >> "$report_file"
    echo "Verification Results:" >> "$report_file"
    
    # Add verification results summary
    local total_errors
    local total_warnings
    total_errors=$(grep -c "ERROR:" "$LOG_FILE" 2>/dev/null || echo "0")
    total_warnings=$(grep -c "WARNING:" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "- Total Errors: $total_errors" >> "$report_file"
    echo "- Total Warnings: $total_warnings" >> "$report_file"
    
    if [ $total_errors -eq 0 ]; then
        echo "- Overall Status: PASSED" >> "$report_file"
    else
        echo "- Overall Status: FAILED" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "Detailed Verification Log: $LOG_FILE" >> "$report_file"
    echo "Verification completed at: $(date)" >> "$report_file"
    
    log_success "Verification report generated: $report_file"
    echo "REPORT: generated at $report_file" >> "$LOG_FILE"
    
    # Return status based on errors
    if [ $total_errors -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main verification function
main() {
    log_info "=== POST-BUILD VERIFICATION STARTED ==="
    log_info "Platform: $PLATFORM"
    log_info "Build Type: $BUILD_TYPE"
    log_info "Deep Verification: $DEEP_VERIFICATION"
    log_info "Performance Check: $PERFORMANCE_CHECK"
    log_info "Security Scan: $SECURITY_SCAN"
    
    local verification_errors=0
    
    # Find and catalog build artifacts
    if ! find_build_artifacts; then
        ((verification_errors++))
    fi
    
    # Verify artifact integrity
    if [ -f "${PROJECT_ROOT}/scripts/build/artifacts.list" ]; then
        while IFS= read -r artifact; do
            if [ -f "$artifact" ]; then
                if ! verify_artifact_integrity "$artifact"; then
                    ((verification_errors++))
                fi
                
                # Perform deep verification if requested
                if [ "$DEEP_VERIFICATION" = true ]; then
                    perform_deep_verification "$artifact"
                fi
            fi
        done < "${PROJECT_ROOT}/scripts/build/artifacts.list"
    fi
    
    # Run performance checks if requested
    if [ "$PERFORMANCE_CHECK" = true ]; then
        run_performance_checks
    fi
    
    # Run security scans if requested
    if [ "$SECURITY_SCAN" = true ]; then
        run_security_scans
    fi
    
    # Generate comprehensive report
    if ! generate_verification_report; then
        ((verification_errors++))
    fi
    
    # Final result
    echo "Verification completed: $(date)" >> "$LOG_FILE"
    echo "Total errors: $verification_errors" >> "$LOG_FILE"
    
    if [ $verification_errors -eq 0 ]; then
        log_success "=== POST-BUILD VERIFICATION PASSED ==="
        log_success "All verification checks completed successfully!"
        log_success "Check verification report: ${PROJECT_ROOT}/scripts/build/verification-report.txt"
        echo "RESULT: PASSED" >> "$LOG_FILE"
        exit 0
    else
        log_error "=== POST-BUILD VERIFICATION FAILED ==="
        log_error "Found $verification_errors verification errors"
        log_error "Check logs and reports for details"
        echo "RESULT: FAILED ($verification_errors errors)" >> "$LOG_FILE"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Verification interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main