# 🔐 Expo Access Token Integration Guide

This guide provides step-by-step instructions for integrating the Expo access token into the GitHub repository to enable automated mobile deployments.

## 📋 Overview

The mobile deployment workflow requires an Expo access token to authenticate with Expo services for:
- Building mobile apps with EAS Build
- Deploying over-the-air updates with EAS Update
- Managing app configurations and metadata
- Accessing Expo dashboard and analytics

## 🔑 Access Token Details

**Token Value**: `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`

**Permissions**: This token provides access to:
- EAS Build services
- EAS Update deployments
- Project management
- Build artifact access

## 🛠 Repository Secret Setup

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**
   - Go to https://github.com/GrizzlyRooster34/mobile-mechanic-app
   - Click on the "Settings" tab
   - Select "Secrets and variables" → "Actions" from the left sidebar

2. **Add New Repository Secret**
   - Click "New repository secret"
   - **Name**: `EXPO_ACCESS_TOKEN`
   - **Secret**: `cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS`
   - Click "Add secret"

3. **Verify Secret Creation**
   - The secret should appear in the list as `EXPO_ACCESS_TOKEN`
   - The value will be hidden for security

### Method 2: GitHub CLI (Alternative)

If you have GitHub CLI installed:

```bash
# Set the repository secret
gh secret set EXPO_ACCESS_TOKEN --body "cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS" --repo GrizzlyRooster34/mobile-mechanic-app

# Verify the secret was created
gh secret list --repo GrizzlyRooster34/mobile-mechanic-app
```

## ✅ Verification Steps

### 1. Check Workflow Configuration

The mobile deployment workflow (`.github/workflows/mobile-deploy.yml`) should reference the secret:

```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_ACCESS_TOKEN }}
```

### 2. Test the Integration

1. **Trigger a Test Build**
   - Create a pull request with mobile-related changes
   - The workflow should run automatically
   - Check the "Actions" tab for build status

2. **Monitor Build Logs**
   - Look for successful Expo authentication
   - Verify EAS Build commands execute without authentication errors
   - Check for successful preview build creation

### 3. Validate Expo Dashboard Access

1. **Check Expo Dashboard**
   - Visit https://expo.dev/accounts/[your-account]/projects
   - Verify builds appear in the dashboard
   - Confirm build artifacts are accessible

## 🔒 Security Best Practices

### Repository Secret Security

- ✅ **Stored as GitHub repository secret** - Value is encrypted and hidden
- ✅ **Limited scope** - Only accessible to GitHub Actions workflows
- ✅ **Audit trail** - All usage is logged in Actions history
- ✅ **Team access control** - Only repository maintainers can view/edit

### Token Management

- 🔄 **Regular rotation** - Consider rotating the token periodically
- 📊 **Usage monitoring** - Monitor token usage in Expo dashboard
- 🚫 **No local storage** - Never store the token in local files or commits
- 🔍 **Access review** - Regularly review who has access to repository secrets

## 🚀 Deployment Workflow

Once the token is integrated, the automated deployment workflow will:

### On Pull Requests
1. **Authenticate with Expo** using the repository secret
2. **Run code quality checks** (linting, type checking)
3. **Create preview builds** for iOS and Android
4. **Comment on PR** with build status and links

### On Main Branch Merges
1. **Authenticate with Expo** using the repository secret
2. **Create production builds** for app store submission
3. **Deploy OTA updates** to existing app installations
4. **Update Expo dashboard** with new version information

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: Authentication failed
```
**Solution**: Verify the repository secret is correctly set with the exact token value.

#### Token Not Found
```
Error: EXPO_TOKEN environment variable not set
```
**Solution**: Ensure the secret name is exactly `EXPO_ACCESS_TOKEN` (case-sensitive).

#### Permission Denied
```
Error: Insufficient permissions for project
```
**Solution**: Verify the token has the necessary permissions for the Expo project.

### Debug Commands

To test the token locally (for debugging only):

```bash
# Test token authentication (DO NOT commit this)
export EXPO_TOKEN="cBydYET0qZVmkVtGKQHFDGci0JKqW1QToRlzEMiS"
expo whoami

# Test EAS access
eas build:list
```

**⚠️ Important**: Remove the token from your local environment after testing.

## 📞 Support

If you encounter issues with token integration:

1. **Check the workflow logs** in GitHub Actions
2. **Verify secret configuration** in repository settings
3. **Review Expo dashboard** for authentication attempts
4. **Contact the development team** for assistance

## 📚 Related Documentation

- [Mobile Deployment Guide](./MOBILE_DEPLOYMENT.md)
- [Expo Go Setup](./EXPO_GO_SETUP.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Expo Authentication Documentation](https://docs.expo.dev/accounts/programmatic-access/)

---

**🎯 Next Steps**: After setting up the repository secret, the mobile deployment pipeline will be fully functional and ready for automated builds and deployments!