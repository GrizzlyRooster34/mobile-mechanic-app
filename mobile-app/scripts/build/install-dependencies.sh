#!/bin/bash

# Dependency Installation and Setup Script
# This script ensures all required tools and dependencies are properly installed

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
LOG_FILE="${PROJECT_ROOT}/scripts/build/dependency-install.log"
FORCE_REINSTALL=false
INSTALL_ANDROID_TOOLS=false
INSTALL_IOS_TOOLS=false
INSTALL_GLOBAL_TOOLS=false

# Initialize log file
mkdir -p "$(dirname "$LOG_FILE")"
echo "Dependency Installation Started: $(date)" > "$LOG_FILE"

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --force                 Force reinstall all dependencies"
    echo "  -a, --android               Install Android development tools"
    echo "  -i, --ios                   Install iOS development tools (macOS only)"
    echo "  -g, --global                Install global development tools"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          Install project dependencies only"
    echo "  $0 --force                  Clean install all dependencies"
    echo "  $0 --android --global       Install Android tools and global tools"
    echo "  $0 --ios --global           Install iOS tools and global tools"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                FORCE_REINSTALL=true
                shift
                ;;
            -a|--android)
                INSTALL_ANDROID_TOOLS=true
                shift
                ;;
            -i|--ios)
                INSTALL_IOS_TOOLS=true
                shift
                ;;
            -g|--global)
                INSTALL_GLOBAL_TOOLS=true
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
}

# Function to check system requirements
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [ "$major_version" -ge 18 ]; then
            log_success "Node.js version is compatible: v$node_version"
            echo "SYSTEM: Node.js v$node_version OK" >> "$LOG_FILE"
        else
            log_error "Node.js version too old: v$node_version (need v18+)"
            echo "ERROR: Node.js v$node_version too old" >> "$LOG_FILE"
            return 1
        fi
    else
        log_error "Node.js is not installed"
        echo "ERROR: Node.js not found" >> "$LOG_FILE"
        return 1
    fi
    
    # Check NPM
    if command -v npm &> /dev/null; then
        local npm_version
        npm_version=$(npm --version)
        log_success "NPM version: $npm_version"
        echo "SYSTEM: NPM $npm_version" >> "$LOG_FILE"
    else
        log_error "NPM is not installed"
        echo "ERROR: NPM not found" >> "$LOG_FILE"
        return 1
    fi
    
    # Check platform
    local platform
    platform=$(uname -s)
    log_info "Platform: $platform"
    echo "SYSTEM: Platform $platform" >> "$LOG_FILE"
    
    # Check available space
    local available_space
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print int($4/1024/1024)}')
    
    if [ "$available_space" -gt 5 ]; then
        log_success "Sufficient disk space available: ${available_space}GB"
        echo "SYSTEM: ${available_space}GB available" >> "$LOG_FILE"
    else
        log_error "Insufficient disk space: ${available_space}GB (need at least 5GB)"
        echo "ERROR: Insufficient disk space: ${available_space}GB" >> "$LOG_FILE"
        return 1
    fi
    
    log_success "System requirements check passed"
}

# Function to install project dependencies
install_project_dependencies() {
    log_info "Installing project dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Clean install if force reinstall
    if [ "$FORCE_REINSTALL" = true ]; then
        log_info "Force reinstall requested, cleaning existing installation..."
        
        if [ -d "node_modules" ]; then
            log_info "Removing node_modules..."
            rm -rf node_modules
        fi
        
        if [ -f "package-lock.json" ]; then
            log_info "Removing package-lock.json..."
            rm -f package-lock.json
        fi
        
        if [ -f "yarn.lock" ]; then
            log_info "Removing yarn.lock..."
            rm -f yarn.lock
        fi
        
        # Clear npm cache
        npm cache clean --force
        echo "DEPS: Force clean completed" >> "$LOG_FILE"
    fi
    
    # Install dependencies
    log_info "Installing NPM dependencies..."
    if npm install --verbose; then
        log_success "Project dependencies installed successfully"
        echo "DEPS: npm install successful" >> "$LOG_FILE"
    else
        log_error "Failed to install project dependencies"
        echo "ERROR: npm install failed" >> "$LOG_FILE"
        return 1
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
    
    # Check for peer dependencies
    log_info "Checking for peer dependency warnings..."
    npm ls --depth=0 2>&1 | grep "WARN" | grep "peer dep" || log_info "No peer dependency warnings"
    
    log_success "Project dependencies installation completed"
}

# Function to install global development tools
install_global_tools() {
    log_info "Installing global development tools..."
    
    # EAS CLI
    if ! command -v eas &> /dev/null; then
        log_info "Installing EAS CLI..."
        if npm install -g @expo/eas-cli; then
            log_success "EAS CLI installed successfully"
            echo "GLOBAL: EAS CLI installed" >> "$LOG_FILE"
        else
            log_error "Failed to install EAS CLI"
            echo "ERROR: EAS CLI installation failed" >> "$LOG_FILE"
            return 1
        fi
    else
        log_info "EAS CLI already installed"
        local eas_version
        eas_version=$(eas --version)
        log_info "EAS CLI version: $eas_version"
        echo "GLOBAL: EAS CLI $eas_version already installed" >> "$LOG_FILE"
    fi
    
    # Expo CLI
    if ! command -v expo &> /dev/null; then
        log_info "Installing Expo CLI..."
        if npm install -g @expo/cli; then
            log_success "Expo CLI installed successfully"
            echo "GLOBAL: Expo CLI installed" >> "$LOG_FILE"
        else
            log_error "Failed to install Expo CLI"
            echo "ERROR: Expo CLI installation failed" >> "$LOG_FILE"
            return 1
        fi
    else
        log_info "Expo CLI already installed"
        local expo_version
        expo_version=$(expo --version)
        log_info "Expo CLI version: $expo_version"
        echo "GLOBAL: Expo CLI $expo_version already installed" >> "$LOG_FILE"
    fi
    
    # TypeScript
    if ! command -v tsc &> /dev/null; then
        log_info "Installing TypeScript globally..."
        if npm install -g typescript; then
            log_success "TypeScript installed successfully"
            echo "GLOBAL: TypeScript installed" >> "$LOG_FILE"
        else
            log_warning "Failed to install TypeScript globally"
            echo "WARNING: TypeScript global installation failed" >> "$LOG_FILE"
        fi
    else
        local ts_version
        ts_version=$(tsc --version)
        log_info "TypeScript already installed: $ts_version"
        echo "GLOBAL: TypeScript $ts_version already installed" >> "$LOG_FILE"
    fi
    
    log_success "Global development tools installation completed"
}

# Function to install Android development tools
install_android_tools() {
    log_info "Installing Android development tools..."
    
    # Check if Android SDK is already installed
    if [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
        log_info "Android SDK already configured"
        echo "ANDROID: SDK already configured" >> "$LOG_FILE"
        return 0
    fi
    
    # Check platform
    local platform
    platform=$(uname -s)
    
    case $platform in
        "Linux")
            install_android_tools_linux
            ;;
        "Darwin")
            install_android_tools_macos
            ;;
        *)
            log_warning "Automatic Android SDK installation not supported on $platform"
            log_info "Please install Android Studio manually from: https://developer.android.com/studio"
            echo "WARNING: Android SDK manual installation required" >> "$LOG_FILE"
            ;;
    esac
}

# Function to install Android tools on Linux
install_android_tools_linux() {
    log_info "Installing Android tools for Linux..."
    
    # Install Java if not present
    if ! command -v java &> /dev/null; then
        log_info "Installing OpenJDK..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y openjdk-11-jdk
        elif command -v yum &> /dev/null; then
            sudo yum install -y java-11-openjdk-devel
        else
            log_warning "Package manager not found, please install Java manually"
            return 1
        fi
    fi
    
    # Download Android command line tools
    local android_tools_url="https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"
    local tools_dir="$HOME/android-sdk"
    
    log_info "Downloading Android command line tools..."
    mkdir -p "$tools_dir"
    cd "$tools_dir"
    
    if curl -L -o cmdline-tools.zip "$android_tools_url"; then
        log_success "Android command line tools downloaded"
        
        if unzip -q cmdline-tools.zip; then
            mv cmdline-tools latest
            mkdir -p cmdline-tools
            mv latest cmdline-tools/
            
            # Set environment variables
            export ANDROID_HOME="$tools_dir"
            export ANDROID_SDK_ROOT="$tools_dir"
            export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
            
            # Install essential packages
            yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
            "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-33" "build-tools;33.0.0"
            
            log_success "Android SDK installed successfully"
            echo "ANDROID: SDK installed at $tools_dir" >> "$LOG_FILE"
            
            # Add to shell profile
            echo "export ANDROID_HOME=$tools_dir" >> ~/.bashrc
            echo "export ANDROID_SDK_ROOT=$tools_dir" >> ~/.bashrc
            echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
            
            log_info "Android SDK environment variables added to ~/.bashrc"
            echo "ANDROID: Environment variables configured" >> "$LOG_FILE"
        else
            log_error "Failed to extract Android command line tools"
            return 1
        fi
        
        rm cmdline-tools.zip
    else
        log_error "Failed to download Android command line tools"
        return 1
    fi
}

# Function to install Android tools on macOS
install_android_tools_macos() {
    log_info "Installing Android tools for macOS..."
    
    # Check if Homebrew is available
    if command -v brew &> /dev/null; then
        log_info "Installing Android SDK via Homebrew..."
        
        # Install Android SDK
        brew install --cask android-sdk
        
        # Set environment variables
        export ANDROID_HOME="$(brew --prefix)/share/android-sdk"
        export ANDROID_SDK_ROOT="$ANDROID_HOME"
        export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
        
        log_success "Android SDK installed via Homebrew"
        echo "ANDROID: SDK installed via Homebrew" >> "$LOG_FILE"
    else
        log_warning "Homebrew not found. Please install Android Studio manually."
        log_info "Download from: https://developer.android.com/studio"
        echo "WARNING: Android SDK manual installation required" >> "$LOG_FILE"
    fi
}

# Function to install iOS development tools
install_ios_tools() {
    log_info "Installing iOS development tools..."
    
    # Check if on macOS
    if [ "$(uname)" != "Darwin" ]; then
        log_warning "iOS development tools are only available on macOS"
        echo "WARNING: iOS tools require macOS" >> "$LOG_FILE"
        return 0
    fi
    
    # Check if Xcode command line tools are installed
    if ! command -v xcode-select &> /dev/null || ! xcode-select -p &> /dev/null; then
        log_info "Installing Xcode command line tools..."
        if xcode-select --install; then
            log_success "Xcode command line tools installation started"
            log_info "Please complete the installation in the popup dialog"
            echo "IOS: Xcode command line tools installation started" >> "$LOG_FILE"
        else
            log_warning "Xcode command line tools installation failed or already installed"
            echo "WARNING: Xcode command line tools installation issue" >> "$LOG_FILE"
        fi
    else
        log_info "Xcode command line tools already installed"
        echo "IOS: Xcode command line tools already installed" >> "$LOG_FILE"
    fi
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        log_info "Installing CocoaPods..."
        if gem install cocoapods; then
            log_success "CocoaPods installed successfully"
            echo "IOS: CocoaPods installed" >> "$LOG_FILE"
        else
            log_error "Failed to install CocoaPods"
            echo "ERROR: CocoaPods installation failed" >> "$LOG_FILE"
            return 1
        fi
    else
        local pod_version
        pod_version=$(pod --version)
        log_info "CocoaPods already installed: $pod_version"
        echo "IOS: CocoaPods $pod_version already installed" >> "$LOG_FILE"
    fi
    
    # Check if Xcode is installed
    if [ -d "/Applications/Xcode.app" ]; then
        log_success "Xcode is installed"
        echo "IOS: Xcode installed" >> "$LOG_FILE"
    else
        log_warning "Xcode is not installed"
        log_info "Please install Xcode from the Mac App Store for full iOS development"
        echo "WARNING: Xcode not installed" >> "$LOG_FILE"
    fi
    
    log_success "iOS development tools setup completed"
}

# Function to verify all installations
verify_installations() {
    log_info "Verifying all installations..."
    
    local verification_errors=0
    
    # Verify Node.js and NPM
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log_success "Node.js and NPM verified"
        echo "VERIFY: Node.js and NPM OK" >> "$LOG_FILE"
    else
        log_error "Node.js or NPM verification failed"
        echo "ERROR: Node.js or NPM verification failed" >> "$LOG_FILE"
        ((verification_errors++))
    fi
    
    # Verify project dependencies
    cd "$PROJECT_ROOT"
    if [ -d "node_modules" ] && npm ls expo &> /dev/null; then
        log_success "Project dependencies verified"
        echo "VERIFY: Project dependencies OK" >> "$LOG_FILE"
    else
        log_error "Project dependencies verification failed"
        echo "ERROR: Project dependencies verification failed" >> "$LOG_FILE"
        ((verification_errors++))
    fi
    
    # Verify global tools if installed
    if [ "$INSTALL_GLOBAL_TOOLS" = true ]; then
        if command -v eas &> /dev/null && command -v expo &> /dev/null; then
            log_success "Global tools verified"
            echo "VERIFY: Global tools OK" >> "$LOG_FILE"
        else
            log_error "Global tools verification failed"
            echo "ERROR: Global tools verification failed" >> "$LOG_FILE"
            ((verification_errors++))
        fi
    fi
    
    # Verify Android tools if installed
    if [ "$INSTALL_ANDROID_TOOLS" = true ]; then
        if [ -n "${ANDROID_HOME:-}" ] && [ -d "${ANDROID_HOME:-}" ]; then
            log_success "Android tools verified"
            echo "VERIFY: Android tools OK" >> "$LOG_FILE"
        else
            log_warning "Android tools verification incomplete"
            echo "WARNING: Android tools verification incomplete" >> "$LOG_FILE"
        fi
    fi
    
    # Verify iOS tools if installed
    if [ "$INSTALL_IOS_TOOLS" = true ] && [ "$(uname)" = "Darwin" ]; then
        if command -v pod &> /dev/null; then
            log_success "iOS tools verified"
            echo "VERIFY: iOS tools OK" >> "$LOG_FILE"
        else
            log_warning "iOS tools verification incomplete"
            echo "WARNING: iOS tools verification incomplete" >> "$LOG_FILE"
        fi
    fi
    
    return $verification_errors
}

# Function to generate installation report
generate_installation_report() {
    log_info "Generating installation report..."
    
    local report_file="${PROJECT_ROOT}/scripts/build/dependency-report.txt"
    
    cat > "$report_file" << EOF
Mobile Mechanic App - Dependency Installation Report
===================================================

Installation Date: $(date)
Force Reinstall: $FORCE_REINSTALL
Install Android Tools: $INSTALL_ANDROID_TOOLS
Install iOS Tools: $INSTALL_IOS_TOOLS
Install Global Tools: $INSTALL_GLOBAL_TOOLS

System Information:
- Platform: $(uname -s)
- Node.js: $(node --version 2>/dev/null || echo "Not found")
- NPM: $(npm --version 2>/dev/null || echo "Not found")

Installed Components:

Project Dependencies:
$(cd "$PROJECT_ROOT" && npm ls --depth=0 2>/dev/null || echo "Dependencies check failed")

Global Tools:
- EAS CLI: $(eas --version 2>/dev/null || echo "Not installed")
- Expo CLI: $(expo --version 2>/dev/null || echo "Not installed")
- TypeScript: $(tsc --version 2>/dev/null || echo "Not installed")

Development Environment:
- Android SDK: ${ANDROID_HOME:-"Not configured"}
- iOS Tools: $([ "$(uname)" = "Darwin" ] && pod --version 2>/dev/null || echo "Not available/installed")

Installation Log: scripts/build/dependency-install.log
Installation completed at: $(date)
EOF
    
    log_success "Installation report generated: $report_file"
    echo "REPORT: Installation report generated" >> "$LOG_FILE"
}

# Main installation function
main() {
    log_info "=== DEPENDENCY INSTALLATION STARTED ==="
    log_info "Force Reinstall: $FORCE_REINSTALL"
    log_info "Install Android Tools: $INSTALL_ANDROID_TOOLS"
    log_info "Install iOS Tools: $INSTALL_IOS_TOOLS"
    log_info "Install Global Tools: $INSTALL_GLOBAL_TOOLS"
    
    local install_errors=0
    
    # Check system requirements
    if ! check_system_requirements; then
        log_error "System requirements check failed"
        exit 1
    fi
    
    # Install project dependencies
    if ! install_project_dependencies; then
        ((install_errors++))
    fi
    
    # Install global tools if requested
    if [ "$INSTALL_GLOBAL_TOOLS" = true ]; then
        if ! install_global_tools; then
            ((install_errors++))
        fi
    fi
    
    # Install Android tools if requested
    if [ "$INSTALL_ANDROID_TOOLS" = true ]; then
        if ! install_android_tools; then
            ((install_errors++))
        fi
    fi
    
    # Install iOS tools if requested
    if [ "$INSTALL_IOS_TOOLS" = true ]; then
        if ! install_ios_tools; then
            ((install_errors++))
        fi
    fi
    
    # Verify installations
    if ! verify_installations; then
        log_warning "Some installation verifications failed"
    fi
    
    # Generate installation report
    generate_installation_report
    
    # Final result
    echo "Installation completed: $(date)" >> "$LOG_FILE"
    echo "Total errors: $install_errors" >> "$LOG_FILE"
    
    if [ $install_errors -eq 0 ]; then
        log_success "=== DEPENDENCY INSTALLATION COMPLETED SUCCESSFULLY ==="
        log_success "All requested dependencies have been installed successfully!"
        log_success "Check installation report: ${PROJECT_ROOT}/scripts/build/dependency-report.txt"
        
        if [ "$INSTALL_ANDROID_TOOLS" = true ] || [ "$INSTALL_IOS_TOOLS" = true ]; then
            log_info "Please restart your terminal or source your shell profile to use new environment variables"
        fi
        
        echo "RESULT: SUCCESS" >> "$LOG_FILE"
        exit 0
    else
        log_error "=== DEPENDENCY INSTALLATION COMPLETED WITH ERRORS ==="
        log_error "Found $install_errors installation errors"
        log_error "Check logs and try to resolve the issues"
        echo "RESULT: FAILED ($install_errors errors)" >> "$LOG_FILE"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Installation interrupted"; echo "RESULT: INTERRUPTED" >> "$LOG_FILE"; exit 130' INT TERM

# Parse arguments and run main function
parse_arguments "$@"
main