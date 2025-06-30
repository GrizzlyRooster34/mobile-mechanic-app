#!/usr/bin/env node

/**
 * Predictive Build Failure Detection and Remediation System
 * Uses machine learning-like pattern recognition to predict and prevent build failures
 * Provides actionable remediation steps based on historical data and pattern analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { EventEmitter } = require('events');

class PredictiveBuildAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      historyPath: options.historyPath || 'logs/build-history.json',
      patternsPath: options.patternsPath || 'scripts/build/monitor/failure-patterns.json',
      confidence: options.confidence || 0.7,
      maxHistoryEntries: options.maxHistoryEntries || 1000,
      enablePrediction: options.enablePrediction !== false,
      enableAutoRemediation: options.enableAutoRemediation !== false,
      ...options
    };

    this.buildHistory = this.loadBuildHistory();
    this.failurePatterns = this.loadFailurePatterns();
    this.currentMetrics = {};
    this.riskFactors = {};
    this.remediationStrategies = this.initializeRemediationStrategies();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Monitor for build events
    this.on('build-started', (data) => this.analyzeBuildStart(data));
    this.on('build-progress', (data) => this.analyzeBuildProgress(data));
    this.on('build-completed', (data) => this.recordBuildResult(data));
    this.on('error-detected', (data) => this.analyzeError(data));
  }

  loadBuildHistory() {
    const historyFile = path.join(this.options.projectRoot, this.options.historyPath);
    
    try {
      if (fs.existsSync(historyFile)) {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.log('Loaded build history with ' + history.length + ' entries', 'info');
        return history;
      }
    } catch (error) {
      this.log('Failed to load build history: ' + error.message, 'warn');
    }
    
    return [];
  }

  saveBuildHistory() {
    const historyFile = path.join(this.options.projectRoot, this.options.historyPath);
    const historyDir = path.dirname(historyFile);
    
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    try {
      // Keep only recent entries
      if (this.buildHistory.length > this.options.maxHistoryEntries) {
        this.buildHistory = this.buildHistory.slice(-this.options.maxHistoryEntries);
      }
      
      fs.writeFileSync(historyFile, JSON.stringify(this.buildHistory, null, 2));
      this.log('Build history saved', 'debug');
    } catch (error) {
      this.log('Failed to save build history: ' + error.message, 'error');
    }
  }

  loadFailurePatterns() {
    const patternsFile = path.join(this.options.projectRoot, this.options.patternsPath);
    
    try {
      if (fs.existsSync(patternsFile)) {
        return JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
      }
    } catch (error) {
      this.log('Failed to load failure patterns: ' + error.message, 'warn');
    }
    
    // Return default patterns
    return this.getDefaultFailurePatterns();
  }

  getDefaultFailurePatterns() {
    return {
      dependency_issues: {
        patterns: [
          /Module not found/,
          /Cannot resolve dependency/,
          /Package .* not found/,
          /ERESOLVE unable to resolve dependency tree/,
          /npm ERR! peer dep missing/
        ],
        severity: 'high',
        frequency: 0.0,
        avgRecoveryTime: 300,
        remediationSteps: [
          'clear_npm_cache',
          'reinstall_dependencies',
          'check_package_versions'
        ]
      },
      typescript_errors: {
        patterns: [
          /error TS\d+:/,
          /Type .* is not assignable to type/,
          /Property .* does not exist on type/,
          /Cannot find name/
        ],
        severity: 'medium',
        frequency: 0.0,
        avgRecoveryTime: 180,
        remediationSteps: [
          'check_typescript_config',
          'verify_type_definitions',
          'update_typescript_version'
        ]
      },
      metro_bundler_issues: {
        patterns: [
          /Metro has encountered an error/,
          /Unable to resolve module/,
          /Transform error/,
          /SyntaxError.*Unexpected token/
        ],
        severity: 'high',
        frequency: 0.0,
        avgRecoveryTime: 120,
        remediationSteps: [
          'clear_metro_cache',
          'restart_metro_bundler',
          'check_syntax_errors'
        ]
      },
      android_build_failures: {
        patterns: [
          /BUILD FAILED/,
          /Execution failed for task/,
          /Could not find.*gradle/,
          /AAPT.*error/
        ],
        severity: 'high',
        frequency: 0.0,
        avgRecoveryTime: 600,
        remediationSteps: [
          'clean_android_build',
          'check_gradle_version',
          'verify_android_sdk'
        ]
      },
      ios_build_failures: {
        patterns: [
          /BUILD FAILED/,
          /Command PhaseScriptExecution failed/,
          /Code signing error/,
          /Undefined symbols for architecture/
        ],
        severity: 'high',
        frequency: 0.0,
        avgRecoveryTime: 900,
        remediationSteps: [
          'clean_ios_build',
          'check_code_signing',
          'update_pod_dependencies'
        ]
      },
      memory_issues: {
        patterns: [
          /JavaScript heap out of memory/,
          /FATAL ERROR: Ineffective mark-compacts near heap limit/,
          /Out of memory/
        ],
        severity: 'critical',
        frequency: 0.0,
        avgRecoveryTime: 60,
        remediationSteps: [
          'increase_memory_limit',
          'optimize_build_process',
          'split_build_tasks'
        ]
      },
      network_issues: {
        patterns: [
          /network timeout/,
          /ENOTFOUND/,
          /connect ETIMEDOUT/,
          /Request failed.*timeout/
        ],
        severity: 'medium',
        frequency: 0.0,
        avgRecoveryTime: 30,
        remediationSteps: [
          'retry_with_backoff',
          'check_network_connectivity',
          'use_alternative_registry'
        ]
      }
    };
  }

  initializeRemediationStrategies() {
    return {
      clear_npm_cache: {
        command: 'npm cache clean --force',
        description: 'Clear NPM cache to resolve dependency issues',
        successRate: 0.8,
        estimatedTime: 30
      },
      reinstall_dependencies: {
        command: 'rm -rf node_modules package-lock.json && npm install',
        description: 'Reinstall all dependencies from scratch',
        successRate: 0.9,
        estimatedTime: 120
      },
      clear_metro_cache: {
        command: 'npx expo r -c',
        description: 'Clear Metro bundler cache',
        successRate: 0.85,
        estimatedTime: 15
      },
      clean_android_build: {
        command: 'cd android && ./gradlew clean && cd ..',
        description: 'Clean Android build artifacts',
        successRate: 0.75,
        estimatedTime: 60
      },
      clean_ios_build: {
        command: 'rm -rf ios/build',
        description: 'Clean iOS build artifacts',
        successRate: 0.7,
        estimatedTime: 30
      },
      increase_memory_limit: {
        command: 'export NODE_OPTIONS="--max-old-space-size=8192"',
        description: 'Increase Node.js memory limit',
        successRate: 0.9,
        estimatedTime: 5
      },
      check_typescript_config: {
        command: 'npx tsc --noEmit --listFiles',
        description: 'Validate TypeScript configuration',
        successRate: 0.6,
        estimatedTime: 30
      },
      restart_metro_bundler: {
        command: 'pkill -f "metro" && npx expo start',
        description: 'Restart Metro bundler process',
        successRate: 0.8,
        estimatedTime: 45
      }
    };
  }

  analyzeBuildStart(buildData) {
    this.log('Analyzing build start conditions...', 'info');
    
    const prediction = this.predictBuildOutcome(buildData);
    
    if (prediction.failureRisk > this.options.confidence) {
      this.log(`High failure risk detected: ${(prediction.failureRisk * 100).toFixed(1)}%`, 'warn');
      
      // Emit prediction event
      this.emit('failure-predicted', {
        risk: prediction.failureRisk,
        factors: prediction.riskFactors,
        recommendations: prediction.recommendations,
        timestamp: new Date().toISOString()
      });
      
      // Auto-remediation if enabled
      if (this.options.enableAutoRemediation && prediction.autoRemediable) {
        this.executePreventiveRemediation(prediction.recommendations);
      }
    }
    
    return prediction;
  }

  predictBuildOutcome(buildData) {
    const riskFactors = this.assessRiskFactors(buildData);
    const historicalPatterns = this.analyzeHistoricalPatterns(buildData);
    const environmentalFactors = this.assessEnvironmentalFactors();
    
    // Calculate composite risk score
    const riskScore = this.calculateRiskScore(riskFactors, historicalPatterns, environmentalFactors);
    
    const recommendations = this.generateRecommendations(riskFactors, riskScore);
    
    return {
      failureRisk: riskScore,
      riskFactors: riskFactors,
      historicalPatterns: historicalPatterns,
      environmentalFactors: environmentalFactors,
      recommendations: recommendations,
      autoRemediable: this.isAutoRemediable(recommendations),
      confidence: this.calculateConfidence(riskFactors, historicalPatterns)
    };
  }

  assessRiskFactors(buildData) {
    const factors = {};
    
    // Recent failure history
    const recentFailures = this.getRecentFailures(24); // Last 24 hours
    factors.recentFailureRate = recentFailures.length / Math.max(this.getRecentBuilds(24).length, 1);
    
    // Dependency changes
    factors.dependencyChanges = this.detectDependencyChanges();
    
    // Code complexity changes
    factors.codeComplexity = this.assessCodeComplexity();
    
    // Build configuration changes
    factors.configChanges = this.detectConfigurationChanges();
    
    // Platform-specific risks
    factors.platformRisks = this.assessPlatformRisks(buildData.platform);
    
    // Time-based patterns
    factors.timeBasedRisk = this.assessTimeBasedRisk();
    
    return factors;
  }

  analyzeHistoricalPatterns(buildData) {
    const patterns = {
      successRate: this.calculateSuccessRate(),
      avgBuildTime: this.calculateAverageBuildTime(),
      commonFailurePoints: this.identifyCommonFailurePoints(),
      seasonalPatterns: this.analyzeSeasonalPatterns(),
      platformSuccessRates: this.calculatePlatformSuccessRates()
    };
    
    return patterns;
  }

  assessEnvironmentalFactors() {
    return {
      diskSpace: this.checkDiskSpace(),
      memoryUsage: this.checkMemoryUsage(),
      networkLatency: this.checkNetworkLatency(),
      systemLoad: this.checkSystemLoad(),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }

  calculateRiskScore(riskFactors, historicalPatterns, environmentalFactors) {
    let score = 0;
    
    // Recent failure rate (40% weight)
    score += riskFactors.recentFailureRate * 0.4;
    
    // Historical success rate (20% weight)
    score += (1 - historicalPatterns.successRate) * 0.2;
    
    // Dependency changes (15% weight)
    if (riskFactors.dependencyChanges.major > 0) score += 0.15;
    else if (riskFactors.dependencyChanges.minor > 0) score += 0.05;
    
    // Configuration changes (10% weight)
    if (riskFactors.configChanges) score += 0.1;
    
    // Environmental factors (10% weight)
    if (environmentalFactors.diskSpace < 1000) score += 0.05; // Less than 1GB
    if (environmentalFactors.memoryUsage > 80) score += 0.05; // More than 80%
    
    // Time-based risk (5% weight)
    score += riskFactors.timeBasedRisk * 0.05;
    
    return Math.min(score, 1.0); // Cap at 100%
  }

  generateRecommendations(riskFactors, riskScore) {
    const recommendations = [];
    
    if (riskFactors.dependencyChanges.major > 0) {
      recommendations.push({
        action: 'reinstall_dependencies',
        reason: 'Major dependency changes detected',
        priority: 'high'
      });
    }
    
    if (riskFactors.recentFailureRate > 0.5) {
      recommendations.push({
        action: 'clear_metro_cache',
        reason: 'High recent failure rate',
        priority: 'medium'
      });
    }
    
    if (riskFactors.configChanges) {
      recommendations.push({
        action: 'check_typescript_config',
        reason: 'Configuration changes detected',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  analyzeError(errorData) {
    this.log('Analyzing error: ' + errorData.message, 'debug');
    
    // Match against known patterns
    const matchedPattern = this.matchErrorPattern(errorData.message);
    
    if (matchedPattern) {
      this.log(`Matched pattern: ${matchedPattern.category}`, 'info');
      
      // Update pattern frequency
      this.updatePatternFrequency(matchedPattern.category);
      
      // Generate remediation plan
      const remediationPlan = this.generateRemediationPlan(matchedPattern);
      
      this.emit('remediation-plan', {
        error: errorData,
        pattern: matchedPattern,
        plan: remediationPlan,
        timestamp: new Date().toISOString()
      });
      
      // Auto-execute if configured
      if (this.options.enableAutoRemediation && remediationPlan.autoExecutable) {
        this.executeRemediation(remediationPlan);
      }
      
      return remediationPlan;
    }
    
    // If no pattern matched, try to learn from this error
    this.learnFromNewError(errorData);
    
    return null;
  }

  matchErrorPattern(errorMessage) {
    for (const [category, pattern] of Object.entries(this.failurePatterns)) {
      for (const regex of pattern.patterns) {
        if (regex.test(errorMessage)) {
          return {
            category,
            pattern,
            confidence: this.calculatePatternConfidence(category, errorMessage)
          };
        }
      }
    }
    return null;
  }

  generateRemediationPlan(matchedPattern) {
    const steps = matchedPattern.pattern.remediationSteps.map(stepName => {
      const strategy = this.remediationStrategies[stepName];
      return {
        name: stepName,
        description: strategy.description,
        command: strategy.command,
        estimatedTime: strategy.estimatedTime,
        successRate: strategy.successRate,
        automated: true
      };
    });
    
    return {
      category: matchedPattern.category,
      steps: steps,
      estimatedTotalTime: steps.reduce((sum, step) => sum + step.estimatedTime, 0),
      expectedSuccessRate: this.calculatePlanSuccessRate(steps),
      autoExecutable: steps.every(step => step.automated),
      priority: matchedPattern.pattern.severity
    };
  }

  async executeRemediation(remediationPlan) {
    this.log(`Executing remediation plan for ${remediationPlan.category}`, 'info');
    
    const results = [];
    
    for (const step of remediationPlan.steps) {
      this.log(`Executing: ${step.description}`, 'info');
      
      try {
        const result = await this.executeRemediationStep(step);
        results.push({
          step: step.name,
          success: result.success,
          output: result.output,
          duration: result.duration
        });
        
        if (!result.success) {
          this.log(`Step failed: ${step.name}`, 'warn');
          break; // Stop on first failure
        }
      } catch (error) {
        this.log(`Step error: ${step.name} - ${error.message}`, 'error');
        results.push({
          step: step.name,
          success: false,
          error: error.message,
          duration: 0
        });
        break;
      }
    }
    
    const overallSuccess = results.every(r => r.success);
    
    this.emit('remediation-completed', {
      plan: remediationPlan,
      results: results,
      success: overallSuccess,
      timestamp: new Date().toISOString()
    });
    
    return { success: overallSuccess, results };
  }

  executeRemediationStep(step) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      exec(step.command, { cwd: this.options.projectRoot }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        
        if (error) {
          resolve({
            success: false,
            output: stderr || error.message,
            duration
          });
        } else {
          resolve({
            success: true,
            output: stdout,
            duration
          });
        }
      });
    });
  }

  recordBuildResult(buildData) {
    const buildRecord = {
      timestamp: new Date().toISOString(),
      platform: buildData.platform,
      buildType: buildData.buildType,
      success: buildData.success,
      duration: buildData.duration,
      errors: buildData.errors || [],
      warnings: buildData.warnings || [],
      environmentalFactors: this.assessEnvironmentalFactors(),
      riskFactors: buildData.riskFactors || {},
      remediation: buildData.remediation || null
    };
    
    this.buildHistory.push(buildRecord);
    this.saveBuildHistory();
    
    // Update pattern frequencies based on this build
    this.updatePatternsFromBuild(buildRecord);
    
    this.log(`Build result recorded: ${buildData.success ? 'SUCCESS' : 'FAILURE'}`, 'info');
  }

  // Utility methods for risk assessment
  getRecentFailures(hours) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.buildHistory.filter(build => 
      new Date(build.timestamp) > cutoff && !build.success
    );
  }

  getRecentBuilds(hours) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.buildHistory.filter(build => 
      new Date(build.timestamp) > cutoff
    );
  }

  detectDependencyChanges() {
    // Check if package.json has been modified recently
    try {
      const packageJsonPath = path.join(this.options.projectRoot, 'package.json');
      const stats = fs.statSync(packageJsonPath);
      const lastModified = new Date(stats.mtime);
      const hoursAgo = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60);
      
      return {
        recent: hoursAgo < 24,
        major: hoursAgo < 1, // Very recent changes
        minor: hoursAgo < 24 && hoursAgo >= 1
      };
    } catch (error) {
      return { recent: false, major: 0, minor: 0 };
    }
  }

  assessCodeComplexity() {
    // Simple heuristic based on file count and size
    try {
      const appDir = path.join(this.options.projectRoot, 'app');
      if (fs.existsSync(appDir)) {
        const files = this.getFileCount(appDir, ['.ts', '.tsx', '.js', '.jsx']);
        return Math.min(files / 100, 1); // Normalize to 0-1
      }
    } catch (error) {
      // Ignore errors
    }
    return 0.5; // Default medium complexity
  }

  getFileCount(dir, extensions) {
    let count = 0;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          count += this.getFileCount(fullPath, extensions);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          count++;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return count;
  }

  detectConfigurationChanges() {
    // Check if any configuration files have been modified recently
    const configFiles = [
      'tsconfig.json', 'babel.config.js', 'metro.config.js', 
      'eas.json', 'app.json', 'expo.json'
    ];
    
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    return configFiles.some(file => {
      try {
        const filePath = path.join(this.options.projectRoot, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          return new Date(stats.mtime) > cutoff;
        }
      } catch (error) {
        // Ignore errors
      }
      return false;
    });
  }

  assessPlatformRisks(platform) {
    const platformHistory = this.buildHistory.filter(build => build.platform === platform);
    if (platformHistory.length === 0) return 0.5; // Default medium risk
    
    const recentPlatformBuilds = platformHistory.slice(-10); // Last 10 builds
    const failureRate = recentPlatformBuilds.filter(build => !build.success).length / recentPlatformBuilds.length;
    
    return failureRate;
  }

  assessTimeBasedRisk() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    // Higher risk during off-hours and weekends
    let risk = 0;
    
    if (hour < 6 || hour > 22) risk += 0.2; // Night hours
    if (day === 0 || day === 6) risk += 0.1; // Weekends
    
    return Math.min(risk, 1);
  }

  checkDiskSpace() {
    // Return available disk space in MB
    try {
      const { execSync } = require('child_process');
      const output = execSync('df . | tail -1 | awk "{print $4}"', { encoding: 'utf8' });
      return parseInt(output.trim()) / 1024; // Convert KB to MB
    } catch (error) {
      return 5000; // Default 5GB if unable to check
    }
  }

  checkMemoryUsage() {
    // Return memory usage percentage
    try {
      const usage = process.memoryUsage();
      const total = usage.heapTotal;
      const used = usage.heapUsed;
      return (used / total) * 100;
    } catch (error) {
      return 50; // Default 50% if unable to check
    }
  }

  checkNetworkLatency() {
    // Simple network check - could be expanded
    return Math.random() * 100; // Mock latency for now
  }

  checkSystemLoad() {
    try {
      const os = require('os');
      const loadavg = os.loadavg();
      return loadavg[0]; // 1-minute load average
    } catch (error) {
      return 1; // Default load
    }
  }

  calculateSuccessRate() {
    if (this.buildHistory.length === 0) return 0.5;
    
    const successfulBuilds = this.buildHistory.filter(build => build.success).length;
    return successfulBuilds / this.buildHistory.length;
  }

  calculateAverageBuildTime() {
    if (this.buildHistory.length === 0) return 300; // Default 5 minutes
    
    const totalTime = this.buildHistory.reduce((sum, build) => sum + (build.duration || 300), 0);
    return totalTime / this.buildHistory.length;
  }

  identifyCommonFailurePoints() {
    const errorPatterns = {};
    
    this.buildHistory.forEach(build => {
      if (!build.success && build.errors) {
        build.errors.forEach(error => {
          const pattern = this.matchErrorPattern(error);
          if (pattern) {
            errorPatterns[pattern.category] = (errorPatterns[pattern.category] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(errorPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 failure points
      .map(([pattern, count]) => ({ pattern, count }));
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[35m',
      success: '\x1b[32m'
    };
    
    const color = colors[level] || colors.info;
    const reset = '\x1b[0m';
    
    console.log(`${color}[${timestamp}] [PREDICTOR] [${level.toUpperCase()}] ${message}${reset}`);
    
    // Also emit as event for external logging
    this.emit('log', { timestamp, level, message });
  }

  // Public API methods
  startMonitoring() {
    this.log('Predictive analyzer started', 'info');
    this.emit('analyzer-started');
  }

  stopMonitoring() {
    this.log('Predictive analyzer stopped', 'info');
    this.emit('analyzer-stopped');
  }

  getHealthReport() {
    return {
      totalBuilds: this.buildHistory.length,
      successRate: this.calculateSuccessRate(),
      avgBuildTime: this.calculateAverageBuildTime(),
      commonFailures: this.identifyCommonFailurePoints(),
      riskFactors: this.riskFactors,
      patternsTracked: Object.keys(this.failurePatterns).length,
      lastAnalysis: new Date().toISOString()
    };
  }

  getFailurePrediction(buildData) {
    return this.predictBuildOutcome(buildData);
  }

  // Learning methods
  learnFromNewError(errorData) {
    // This would be expanded with actual ML techniques
    this.log(`Learning from new error pattern: ${errorData.message.substring(0, 100)}...`, 'debug');
    
    // For now, just log it for manual pattern creation
    const learningData = {
      timestamp: new Date().toISOString(),
      error: errorData,
      context: this.currentMetrics
    };
    
    this.emit('learning-opportunity', learningData);
  }

  updatePatternFrequency(category) {
    if (this.failurePatterns[category]) {
      this.failurePatterns[category].frequency += 1;
    }
  }

  calculatePatternConfidence(category, errorMessage) {
    // Simple confidence calculation based on pattern frequency and match quality
    const pattern = this.failurePatterns[category];
    if (!pattern) return 0.5;
    
    const frequencyScore = Math.min(pattern.frequency / 10, 1); // Normalize frequency
    const matchScore = errorMessage.length > 0 ? 1 : 0.5; // Basic match quality
    
    return (frequencyScore + matchScore) / 2;
  }

  calculatePlanSuccessRate(steps) {
    if (steps.length === 0) return 0;
    
    // Calculate compound success rate
    return steps.reduce((rate, step) => rate * step.successRate, 1);
  }

  calculateConfidence(riskFactors, historicalPatterns) {
    // Calculate confidence based on available data
    let confidence = 0.5; // Base confidence
    
    if (this.buildHistory.length > 10) confidence += 0.2;
    if (this.buildHistory.length > 50) confidence += 0.2;
    if (historicalPatterns.successRate > 0.8) confidence += 0.1;
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }

  isAutoRemediable(recommendations) {
    return recommendations.every(rec => 
      this.remediationStrategies[rec.action] && 
      this.remediationStrategies[rec.action].successRate > 0.7
    );
  }

  // Additional utility methods would go here...
}

// CLI interface
if (require.main === module) {
  const analyzer = new PredictiveBuildAnalyzer({
    projectRoot: process.cwd(),
    enablePrediction: process.env.ENABLE_PREDICTION !== 'false',
    enableAutoRemediation: process.env.ENABLE_AUTO_REMEDIATION === 'true'
  });

  // Start monitoring
  analyzer.startMonitoring();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down predictive analyzer...');
    analyzer.stopMonitoring();
    process.exit(0);
  });

  // Example usage - simulate build events
  setTimeout(() => {
    analyzer.emit('build-started', {
      platform: 'android',
      buildType: 'development',
      timestamp: new Date().toISOString()
    });
  }, 1000);

  // Show health report every 30 seconds
  setInterval(() => {
    const report = analyzer.getHealthReport();
    console.log('\n=== Predictive Analysis Health Report ===');
    console.log(`Total Builds: ${report.totalBuilds}`);
    console.log(`Success Rate: ${(report.successRate * 100).toFixed(1)}%`);
    console.log(`Avg Build Time: ${Math.round(report.avgBuildTime)}s`);
    console.log(`Patterns Tracked: ${report.patternsTracked}`);
    console.log('==========================================\n');
  }, 30000);
}

module.exports = PredictiveBuildAnalyzer;