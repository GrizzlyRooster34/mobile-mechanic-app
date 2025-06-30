#!/bin/bash

# Pre-build Validation Script
# This script validates all prerequisites before starting any build process

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

# Project root directory
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${PROJECT_ROOT}/scripts/build/validation.log"

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Pre-build Validation Started: $(date)" > "$LOG_FILE"

log_info "Starting pre-build validation for Mobile Mechanic App"
log_info "Project Root: $PROJECT_ROOT"
log_info "Log File: $LOG_FILE"

# Function to check command availability
check_command() {
    local cmd=$1
    local required=${2:-true}
    
    if command -v "$cmd" &> /dev/null; then
        local version
        case $cmd in
            "node")
                version=$(node --version)
                ;;
            "npm")
                version=$(npm --version)
                ;;
            "npx")
                version=$(npx --version)
                ;;
            "eas")
                version=$(eas --version 2>/dev/null || echo "unknown")
                ;;
            "expo")
                version=$(npx expo --version 2>/dev/null || echo "unknown")
                ;;
            *)
                version="installed"
                ;;
        esac
        log_success "$cmd is available (version: $version)"
        echo "$cmd: $version" >> "$LOG_FILE"
        return 0
    else
        if [ "$required" = "true" ]; then
            log_error "$cmd is required but not installed"
            echo "ERROR: $cmd not found" >> "$LOG_FILE"
            return 1
        else
            log_warning "$cmd is not installed (optional)"
            echo "WARNING: $cmd not found" >> "$LOG_FILE"
            return 0
        fi
    fi
}

# Function to validate file exists
validate_file() {
    local file=$1
    local required=${2:-true}
    
    if [ -f "$file" ]; then
        log_success "File exists: $file"
        echo "FILE OK: $file" >> "$LOG_FILE"
        return 0
    else
        if [ "$required" = "true" ]; then
            log_error "Required file missing: $file"
            echo "ERROR: Missing file: $file" >> "$LOG_FILE"
            return 1
        else
            log_warning "Optional file missing: $file"
            echo "WARNING: Missing file: $file" >> "$LOG_FILE"
            return 0
        fi
    fi
}

# Function to validate JSON file
validate_json() {
    local file=$1
    local required=${2:-true}
    
    if ! validate_file "$file" "$required"; then
        return 1
    fi
    
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            log_success "JSON syntax valid: $file"
            echo "JSON OK: $file" >> "$LOG_FILE"
            return 0
        else
            log_error "Invalid JSON syntax: $file"
            echo "ERROR: Invalid JSON: $file" >> "$LOG_FILE"
            return 1
        fi
    fi
}

# Function to check network connectivity
check_network() {
    log_info "Checking network connectivity..."
    
    # Check general internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "Internet connectivity: OK"
        echo "NETWORK: Internet OK" >> "$LOG_FILE"
    else
        log_error "No internet connectivity"
        echo "ERROR: No internet connectivity" >> "$LOG_FILE"
        return 1
    fi
    
    # Check Expo services
    if curl -s --connect-timeout 10 https://exp.host > /dev/null; then
        log_success "Expo services connectivity: OK"
        echo "NETWORK: Expo services OK" >> "$LOG_FILE"
    else
        log_warning "Cannot reach Expo services"
        echo "WARNING: Expo services unreachable" >> "$LOG_FILE"
    fi
    
    # Check npm registry
    if curl -s --connect-timeout 10 https://registry.npmjs.org > /dev/null; then
        log_success "NPM registry connectivity: OK"
        echo "NETWORK: NPM registry OK" >> "$LOG_FILE"
    else
        log_error "Cannot reach NPM registry"
        echo "ERROR: NPM registry unreachable" >> "$LOG_FILE"
        return 1
    fi
}

# Function to validate dependencies
validate_dependencies() {
    log_info "Validating dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists and is valid
    if ! validate_json "package.json" true; then
        return 1
    fi
    
    # Check for node_modules
    if [ -d "node_modules" ]; then
        log_success "node_modules directory exists"
        echo "DEPS: node_modules exists" >> "$LOG_FILE"
        
        # Check if dependencies are properly installed
        if npm ls --depth=0 &> /dev/null; then
            log_success "Dependencies are properly installed"
            echo "DEPS: Dependencies OK" >> "$LOG_FILE"
        else
            log_warning "Some dependencies may be missing or have issues"
            echo "WARNING: Dependency issues detected" >> "$LOG_FILE"
        fi
    else
        log_warning "node_modules directory not found - dependencies need to be installed"
        echo "WARNING: node_modules missing" >> "$LOG_FILE"
    fi
    
    # Check for critical Expo dependencies
    local critical_deps=("expo" "@expo/vector-icons" "react" "react-native")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ] || npm ls "$dep" &> /dev/null; then
            log_success "Critical dependency found: $dep"
            echo "DEPS: $dep OK" >> "$LOG_FILE"
        else
            log_error "Critical dependency missing: $dep"
            echo "ERROR: Missing critical dep: $dep" >> "$LOG_FILE"
            return 1
        fi
    done
}

# Function to validate Expo configuration
validate_expo_config() {
    log_info "Validating Expo configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Validate app.json
    if ! validate_json "app.json" true; then
        return 1
    fi
    
    # Validate eas.json
    if ! validate_json "eas.json" true; then
        return 1
    fi
    
    # Check for required assets
    local required_assets=("assets/icon.png" "assets/adaptive-icon.png" "assets/splash-icon.png")
    for asset in "${required_assets[@]}"; do
        if ! validate_file "$asset" true; then
            return 1
        fi
    done
    
    # Validate app.json structure
    if node -e "
        const config = JSON.parse(require('fs').readFileSync('app.json', 'utf8'));
        if (!config.expo) throw new Error('Missing expo config');
        if (!config.expo.name) throw new Error('Missing app name');
        if (!config.expo.slug) throw new Error('Missing app slug');
        if (!config.expo.version) throw new Error('Missing app version');
        console.log('Expo config structure is valid');
    " 2>/dev/null; then
        log_success "Expo configuration structure is valid"
        echo "CONFIG: Expo structure OK" >> "$LOG_FILE"
    else
        log_error "Invalid Expo configuration structure"
        echo "ERROR: Invalid Expo config structure" >> "$LOG_FILE"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    # Get available space in GB
    local available_space
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print int($4/1024/1024)}')
    
    if [ "$available_space" -gt 2 ]; then
        log_success "Sufficient disk space available: ${available_space}GB"
        echo "DISK: ${available_space}GB available" >> "$LOG_FILE"
    else
        log_error "Insufficient disk space: ${available_space}GB (need at least 2GB)"
        echo "ERROR: Insufficient disk space: ${available_space}GB" >> "$LOG_FILE"
        return 1
    fi
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [ "$major_version" -ge 18 ]; then
        log_success "Node.js version is compatible: v$node_version"
        echo "ENV: Node.js v$node_version OK" >> "$LOG_FILE"
    else
        log_error "Node.js version too old: v$node_version (need v18+)"
        echo "ERROR: Node.js v$node_version too old" >> "$LOG_FILE"
        return 1
    fi
    
    # Check NPM version
    local npm_version
    npm_version=$(npm --version)
    log_success "NPM version: $npm_version"
    echo "ENV: NPM $npm_version" >> "$LOG_FILE"
    
    # Check platform
    local platform
    platform=$(uname -s)
    log_info "Platform: $platform"
    echo "ENV: Platform $platform" >> "$LOG_FILE"
    
    # Check for WSL if on Linux
    if [ "$platform" = "Linux" ] && [ -n "${WSL_DISTRO_NAME:-}" ]; then
        log_info "Running in WSL: $WSL_DISTRO_NAME"
        echo "ENV: WSL $WSL_DISTRO_NAME" >> "$LOG_FILE"
    fi
}

# Main validation function
main() {
    log_info "=== PRE-BUILD VALIDATION STARTED ==="
    
    local validation_errors=0
    
    # 1. Check required commands
    log_info "1. Checking required commands..."
    check_command "node" true || ((validation_errors++))
    check_command "npm" true || ((validation_errors++))
    check_command "npx" true || ((validation_errors++))
    
    # 2. Check optional commands
    log_info "2. Checking optional commands..."
    check_command "eas" false
    check_command "expo" false
    
    # 3. Validate environment
    log_info "3. Validating environment..."
    validate_environment || ((validation_errors++))
    
    # 4. Check disk space
    log_info "4. Checking disk space..."
    check_disk_space || ((validation_errors++))
    
    # 5. Check network connectivity
    log_info "5. Checking network connectivity..."
    check_network || ((validation_errors++))
    
    # 6. Validate project files
    log_info "6. Validating project files..."
    validate_file "$PROJECT_ROOT/package.json" true || ((validation_errors++))
    validate_file "$PROJECT_ROOT/app.json" true || ((validation_errors++))
    validate_file "$PROJECT_ROOT/eas.json" true || ((validation_errors++))
    validate_file "$PROJECT_ROOT/tsconfig.json" true || ((validation_errors++))
    validate_file "$PROJECT_ROOT/babel.config.js" true || ((validation_errors++))
    
    # 7. Validate configuration files
    log_info "7. Validating configuration files..."
    validate_expo_config || ((validation_errors++))
    
    # 8. Validate dependencies
    log_info "8. Validating dependencies..."
    validate_dependencies || ((validation_errors++))
    
    # Summary
    echo "Validation completed: $(date)" >> "$LOG_FILE"
    echo "Total errors: $validation_errors" >> "$LOG_FILE"
    
    if [ $validation_errors -eq 0 ]; then
        log_success "=== PRE-BUILD VALIDATION PASSED ==="
        log_success "All validations completed successfully!"
        log_success "The project is ready for building."
        echo "RESULT: PASSED" >> "$LOG_FILE"
        exit 0
    else
        log_error "=== PRE-BUILD VALIDATION FAILED ==="
        log_error "Found $validation_errors validation errors."
        log_error "Please fix the issues above before proceeding with the build."
        echo "RESULT: FAILED ($validation_errors errors)" >> "$LOG_FILE"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Validation interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Run main function
main "$@"