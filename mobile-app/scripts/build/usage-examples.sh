#!/bin/bash

# Usage Examples for Mobile Mechanic App Build Scripts
# This script demonstrates how to use the build scripts effectively

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Mobile Mechanic App - Build Scripts Usage Examples${NC}"
echo "=================================================="
echo ""

# Function to show example with description
show_example() {
    local title=$1
    local description=$2
    local command=$3
    
    echo -e "${GREEN}$title${NC}"
    echo "$description"
    echo -e "${YELLOW}Command:${NC} $command"
    echo ""
}

echo -e "${BLUE}=== SETUP AND INSTALLATION ===${NC}"
echo ""

show_example "1. Initial Setup" \
"Install all dependencies and development tools" \
"./scripts/build/install-dependencies.sh --global --android"

show_example "2. Force Clean Installation" \
"Completely reinstall all dependencies from scratch" \
"./scripts/build/install-dependencies.sh --force --global"

show_example "3. Environment Validation" \
"Check if everything is properly configured" \
"./scripts/build/pre-build-validation.sh"

echo -e "${BLUE}=== DEVELOPMENT BUILDS ===${NC}"
echo ""

show_example "4. Quick Development Build" \
"Build for Android development with all validations" \
"./scripts/build/build-automation.sh --dev-workflow --platform android"

show_example "5. Clean Development Build" \
"Clean development build for all platforms" \
"./scripts/build/local-build-dev.sh --platform all --clean"

show_example "6. Development Build with Verification" \
"Manual development build with post-build verification" \
"./scripts/build/local-build-dev.sh --platform android && ./scripts/build/post-build-verification.sh --platform android --type development"

echo -e "${BLUE}=== PRODUCTION BUILDS ===${NC}"
echo ""

show_example "7. Complete Production Workflow" \
"Full production build with all validations and verifications" \
"./scripts/build/build-automation.sh --prod-workflow --platform all --clean"

show_example "8. Production Build with Version Bump" \
"Production build with custom version and build number" \
"./scripts/build/local-build-prod.sh --platform all --version 1.0.1 --build-number 2"

show_example "9. Production Build with Security Scan" \
"Production build with comprehensive security and performance checks" \
"./scripts/build/local-build-prod.sh --platform android && ./scripts/build/post-build-verification.sh --platform android --type production --deep --performance --security"

echo -e "${BLUE}=== CLOUD BUILDS ===${NC}"
echo ""

show_example "10. Cloud Build for Production" \
"Build using EAS cloud services for production" \
"./scripts/build/cloud-build-eas.sh --platform all --profile production"

show_example "11. Cloud Build with Auto-Submit" \
"Cloud build that automatically submits to app stores" \
"./scripts/build/cloud-build-eas.sh --platform all --profile production --auto-submit"

show_example "12. Complete Cloud Workflow" \
"Full cloud workflow with notifications" \
"./scripts/build/build-automation.sh --cloud-workflow --platform all --notify --email dev@company.com"

echo -e "${BLUE}=== COMPREHENSIVE WORKFLOWS ===${NC}"
echo ""

show_example "13. Full End-to-End Workflow" \
"Complete workflow: development → production → cloud builds" \
"./scripts/build/build-automation.sh --full-workflow --platform all"

show_example "14. Production Workflow with Notifications" \
"Production workflow with Slack notifications" \
"./scripts/build/build-automation.sh --prod-workflow --platform all --clean --slack https://hooks.slack.com/..."

show_example "15. Development Workflow (Skip Validation)" \
"Quick development build skipping pre-validation" \
"./scripts/build/build-automation.sh --dev-workflow --platform android --skip-validation"

echo -e "${BLUE}=== VERIFICATION AND TESTING ===${NC}"
echo ""

show_example "16. Deep Artifact Analysis" \
"Comprehensive analysis of build artifacts" \
"./scripts/build/post-build-verification.sh --platform all --type production --deep --performance --security"

show_example "17. Quick Verification" \
"Basic verification of existing build outputs" \
"./scripts/build/post-build-verification.sh --platform android --type production"

show_example "18. Performance Check Only" \
"Check only performance metrics of builds" \
"./scripts/build/post-build-verification.sh --platform all --performance"

echo -e "${BLUE}=== TROUBLESHOOTING ===${NC}"
echo ""

show_example "19. Clean Everything" \
"Complete clean and reinstall of everything" \
"./scripts/build/install-dependencies.sh --force && ./scripts/build/build-automation.sh --prod-workflow --clean"

show_example "20. Validation Only" \
"Run only pre-build validation to check setup" \
"./scripts/build/pre-build-validation.sh"

show_example "21. Check Build Outputs" \
"Verify what build artifacts exist without building" \
"find ./builds -name '*.apk' -o -name '*.aab' -o -name '*.ipa' | head -10"

echo -e "${BLUE}=== ADVANCED SCENARIOS ===${NC}"
echo ""

show_example "22. Android-Only Production Pipeline" \
"Complete Android production pipeline" \
"./scripts/build/build-automation.sh --prod-workflow --platform android --clean --notify"

show_example "23. iOS-Only Cloud Build" \
"iOS cloud build with EAS" \
"./scripts/build/cloud-build-eas.sh --platform ios --profile production --auto-submit"

show_example "24. Multiple Build Types" \
"Build both development and production versions" \
"./scripts/build/local-build-dev.sh --platform android && ./scripts/build/local-build-prod.sh --platform android"

echo -e "${BLUE}=== MONITORING AND REPORTING ===${NC}"
echo ""

show_example "25. Check All Logs" \
"View all build logs and reports" \
"ls -la ./scripts/build/*.log ./scripts/build/*-report.txt"

show_example "26. View Latest Build Report" \
"Check the most recent workflow report" \
"cat ./scripts/build/workflow-report.txt"

show_example "27. Check Validation Log" \
"Review pre-build validation results" \
"cat ./scripts/build/validation.log"

echo ""
echo -e "${GREEN}Common Usage Patterns:${NC}"
echo ""
echo "🚀 Quick Start (New Developer):"
echo "   1. ./scripts/build/install-dependencies.sh --global --android"
echo "   2. ./scripts/build/build-automation.sh --dev-workflow --platform android"
echo ""
echo "🏭 Production Release:"
echo "   1. ./scripts/build/build-automation.sh --prod-workflow --platform all --clean"
echo "   2. ./scripts/build/cloud-build-eas.sh --platform all --profile production --auto-submit"
echo ""
echo "🧪 Testing Build Pipeline:"
echo "   1. ./scripts/build/pre-build-validation.sh"
echo "   2. ./scripts/build/local-build-dev.sh --platform android"
echo "   3. ./scripts/build/post-build-verification.sh --platform android --deep"
echo ""
echo "🔧 Troubleshooting:"
echo "   1. Check logs: ls ./scripts/build/*.log"
echo "   2. Clean install: ./scripts/build/install-dependencies.sh --force"
echo "   3. Validate: ./scripts/build/pre-build-validation.sh"
echo ""
echo -e "${YELLOW}For more details, see: ./scripts/build/README.md${NC}"