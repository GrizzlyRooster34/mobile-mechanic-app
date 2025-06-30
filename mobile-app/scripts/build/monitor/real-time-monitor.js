#!/usr/bin/env node

/**
 * Real-time Build Monitor
 * Monitors Metro bundler, TypeScript compilation, and native builds for errors
 * Provides immediate feedback and automated recovery mechanisms
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

class RealTimeBuildMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      logLevel: options.logLevel || 'info',
      enableWebSocket: options.enableWebSocket || true,
      wsPort: options.wsPort || 8081,
      enableNotifications: options.enableNotifications || false,
      maxLogSize: options.maxLogSize || 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.monitoredProcesses = new Map();
    this.errorPatterns = this.loadErrorPatterns();
    this.buildMetrics = {
      startTime: null,
      errors: [],
      warnings: [],
      buildEvents: [],
      performance: {}
    };

    this.setupLogging();
    this.setupWebSocket();
    this.setupFileWatchers();

    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  setupLogging() {
    const logsDir = path.join(this.options.projectRoot, 'logs', 'monitor');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFile = path.join(logsDir, `monitor-${new Date().toISOString().split('T')[0]}.log`);
    this.errorLogFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
  }

  setupWebSocket() {
    if (!this.options.enableWebSocket) return;

    try {
      this.wss = new WebSocket.Server({ port: this.options.wsPort });
      this.wss.on('connection', (ws) => {
        this.log('Dashboard connected', 'info');
        ws.send(JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString(),
          metrics: this.buildMetrics
        }));
      });
    } catch (error) {
      this.log(`WebSocket setup failed: ${error.message}`, 'warn');
    }
  }

  setupFileWatchers() {
    // Watch TypeScript config files
    const tsConfigPath = path.join(this.options.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      fs.watchFile(tsConfigPath, () => {
        this.log('TypeScript config changed, triggering validation', 'info');
        this.validateTypeScript();
      });
    }

    // Watch package.json for dependency changes
    const packageJsonPath = path.join(this.options.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      fs.watchFile(packageJsonPath, () => {
        this.log('Package.json changed, checking dependencies', 'info');
        this.validateDependencies();
      });
    }
  }

  loadErrorPatterns() {
    return {
      metro: [
        /Unable to resolve module/,
        /SyntaxError/,
        /Module build failed/,
        /BUNDLE.*ERROR/,
        /Metro has encountered an error/,
        /Unable to symbolicate stack trace/,
        /Transform error/
      ],
      typescript: [
        /error TS\d+:/,
        /Cannot find module/,
        /Type.*is not assignable to type/,
        /Property.*does not exist on type/,
        /Argument of type.*is not assignable/,
        /Expected.*arguments, but got/
      ],
      android: [
        /BUILD FAILED/,
        /Could not find.*gradle/,
        /Execution failed for task/,
        /AAPT.*error/,
        /Failed to install.*apk/,
        /Could not connect to development server/,
        /Unable to load script/
      ],
      ios: [
        /BUILD FAILED/,
        /Command PhaseScriptExecution failed/,
        /No such file or directory/,
        /Undefined symbols for architecture/,
        /Could not find iPhone/,
        /Code signing error/,
        /The following build commands failed/
      ],
      runtime: [
        /Unhandled promise rejection/,
        /ReferenceError/,
        /TypeError/,
        /Cannot read property.*of undefined/,
        /Network request failed/,
        /Possible Unhandled Promise Rejection/
      ]
    };
  }

  start() {
    this.log('Starting Real-time Build Monitor', 'info');
    this.buildMetrics.startTime = new Date();

    // Start monitoring different processes
    this.startMetroMonitor();
    this.startTypeScriptMonitor();
    this.startNativeBuildMonitor();
    this.startPerformanceMonitor();

    this.emit('monitor-started');
  }

  stop() {
    this.log('Stopping Real-time Build Monitor', 'info');

    // Stop all monitored processes
    this.monitoredProcesses.forEach((process, name) => {
      this.log(`Stopping ${name} monitor`, 'info');
      if (process && process.kill) {
        process.kill();
      }
    });

    this.monitoredProcesses.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    this.emit('monitor-stopped');
  }

  startMetroMonitor() {
    this.log('Starting Metro bundler monitor', 'info');

    const metroProcess = spawn('npx', ['expo', 'start', '--dev-client'], {
      cwd: this.options.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.monitoredProcesses.set('metro', metroProcess);

    metroProcess.stdout.on('data', (data) => {
      const output = data.toString();
      this.processMetroOutput(output);
    });

    metroProcess.stderr.on('data', (data) => {
      const output = data.toString();
      this.processMetroOutput(output, true);
    });

    metroProcess.on('exit', (code) => {
      if (code !== 0) {
        this.handleError('metro', `Metro process exited with code ${code}`, 'critical');
      }
    });
  }

  processMetroOutput(output, isError = false) {
    const lines = output.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const severity = this.detectMetroSeverity(line);
      
      if (severity === 'error') {
        this.handleError('metro', line, 'high');
      } else if (severity === 'warning') {
        this.handleWarning('metro', line);
      }

      this.broadcastToClients({
        type: 'metro-output',
        data: line,
        severity,
        timestamp: new Date().toISOString(),
        isError
      });
    });
  }

  detectMetroSeverity(line) {
    for (const pattern of this.errorPatterns.metro) {
      if (pattern.test(line)) {
        return 'error';
      }
    }

    if (line.includes('warn') || line.includes('WARN')) {
      return 'warning';
    }

    return 'info';
  }

  startTypeScriptMonitor() {
    this.log('Starting TypeScript monitor', 'info');

    const tscProcess = spawn('npx', ['tsc', '--noEmit', '--watch'], {
      cwd: this.options.projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.monitoredProcesses.set('typescript', tscProcess);

    tscProcess.stdout.on('data', (data) => {
      this.processTypeScriptOutput(data.toString());
    });

    tscProcess.stderr.on('data', (data) => {
      this.processTypeScriptOutput(data.toString(), true);
    });
  }

  processTypeScriptOutput(output, isError = false) {
    const lines = output.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const severity = this.detectTypeScriptSeverity(line);
      
      if (severity === 'error') {
        this.handleError('typescript', line, 'medium');
      } else if (severity === 'warning') {
        this.handleWarning('typescript', line);
      }

      this.broadcastToClients({
        type: 'typescript-output',
        data: line,
        severity,
        timestamp: new Date().toISOString(),
        isError
      });
    });
  }

  detectTypeScriptSeverity(line) {
    for (const pattern of this.errorPatterns.typescript) {
      if (pattern.test(line)) {
        return 'error';
      }
    }

    if (line.includes('Found 0 errors')) {
      return 'success';
    }

    return 'info';
  }

  startNativeBuildMonitor() {
    this.log('Starting native build monitor', 'info');
    
    // Monitor Android builds
    this.monitorAndroidBuilds();
    
    // Monitor iOS builds (if on macOS)
    if (process.platform === 'darwin') {
      this.monitoriOSBuilds();
    }
  }

  monitorAndroidBuilds() {
    const gradleWrapperPath = path.join(this.options.projectRoot, 'android', 'gradlew');
    
    if (!fs.existsSync(gradleWrapperPath)) {
      this.log('Gradle wrapper not found, skipping Android build monitoring', 'warn');
      return;
    }

    // Watch for Android build triggers
    const androidDir = path.join(this.options.projectRoot, 'android');
    fs.watch(androidDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.gradle')) {
        this.log(`Android build file changed: ${filename}`, 'info');
        this.validateAndroidBuild();
      }
    });
  }

  monitoriOSBuilds() {
    const iosDir = path.join(this.options.projectRoot, 'ios');
    
    if (!fs.existsSync(iosDir)) {
      this.log('iOS directory not found, skipping iOS build monitoring', 'warn');
      return;
    }

    fs.watch(iosDir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.xcodeproj') || filename.endsWith('.pbxproj'))) {
        this.log(`iOS build file changed: ${filename}`, 'info');
        this.validateiOSBuild();
      }
    });
  }

  startPerformanceMonitor() {
    this.log('Starting performance monitor', 'info');

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.buildMetrics.performance.memory = {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        timestamp: new Date().toISOString()
      };

      // Alert if memory usage is high
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        this.handleWarning('performance', 'High memory usage detected');
      }
    }, 30000); // Every 30 seconds

    // Monitor CPU usage
    this.monitorCPUUsage();
  }

  monitorCPUUsage() {
    exec('ps -o pid,pcpu,pmem,time,comm -p ' + process.pid, (error, stdout) => {
      if (!error) {
        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const data = lines[1].trim().split(/\s+/);
          this.buildMetrics.performance.cpu = {
            pid: data[0],
            cpuPercent: parseFloat(data[1]),
            memPercent: parseFloat(data[2]),
            time: data[3],
            timestamp: new Date().toISOString()
          };
        }
      }
    });
  }

  async validateTypeScript() {
    return new Promise((resolve) => {
      const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
        cwd: this.options.projectRoot,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      tscProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      tscProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tscProcess.on('close', (code) => {
        if (code !== 0) {
          this.handleError('typescript-validation', errorOutput || output, 'medium');
        } else {
          this.log('TypeScript validation passed', 'success');
        }
        resolve(code === 0);
      });
    });
  }

  async validateDependencies() {
    return new Promise((resolve) => {
      const npmProcess = spawn('npm', ['audit'], {
        cwd: this.options.projectRoot,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';

      npmProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      npmProcess.on('close', (code) => {
        if (output.includes('vulnerabilities')) {
          this.handleWarning('dependencies', 'Security vulnerabilities found in dependencies');
        }
        
        this.broadcastToClients({
          type: 'dependency-audit',
          data: output,
          timestamp: new Date().toISOString()
        });

        resolve(true);
      });
    });
  }

  async validateAndroidBuild() {
    this.log('Validating Android build configuration', 'info');

    const gradleProcess = spawn('./gradlew', ['tasks'], {
      cwd: path.join(this.options.projectRoot, 'android'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    gradleProcess.stderr.on('data', (data) => {
      const output = data.toString();
      for (const pattern of this.errorPatterns.android) {
        if (pattern.test(output)) {
          this.handleError('android-validation', output, 'high');
          break;
        }
      }
    });
  }

  async validateiOSBuild() {
    this.log('Validating iOS build configuration', 'info');

    exec('xcodebuild -list', {
      cwd: path.join(this.options.projectRoot, 'ios')
    }, (error, stdout, stderr) => {
      if (error) {
        this.handleError('ios-validation', error.message, 'high');
      } else {
        this.log('iOS build configuration valid', 'success');
      }
    });
  }

  handleError(source, message, severity = 'medium') {
    const error = {
      id: Date.now().toString(),
      source,
      message,
      severity,
      timestamp: new Date().toISOString(),
      recovered: false
    };

    this.buildMetrics.errors.push(error);
    this.logError(error);

    // Attempt automatic recovery
    this.attemptErrorRecovery(error);

    // Broadcast to connected clients
    this.broadcastToClients({
      type: 'error',
      data: error
    });

    this.emit('error', error);
  }

  handleWarning(source, message) {
    const warning = {
      id: Date.now().toString(),
      source,
      message,
      timestamp: new Date().toISOString()
    };

    this.buildMetrics.warnings.push(warning);
    this.log(`Warning (${source}): ${message}`, 'warn');

    this.broadcastToClients({
      type: 'warning',
      data: warning
    });

    this.emit('warning', warning);
  }

  async attemptErrorRecovery(error) {
    this.log(`Attempting recovery for ${error.source} error`, 'info');

    const recoveryStrategies = {
      metro: this.recoverMetroError.bind(this),
      typescript: this.recoverTypeScriptError.bind(this),
      android: this.recoverAndroidError.bind(this),
      ios: this.recoveriOSError.bind(this)
    };

    const recoveryFunction = recoveryStrategies[error.source];
    if (recoveryFunction) {
      try {
        const recovered = await recoveryFunction(error);
        if (recovered) {
          error.recovered = true;
          this.log(`Successfully recovered from ${error.source} error`, 'success');
        }
      } catch (recoveryError) {
        this.log(`Recovery failed for ${error.source}: ${recoveryError.message}`, 'error');
      }
    }
  }

  async recoverMetroError(error) {
    // Common Metro error recovery strategies
    if (error.message.includes('Unable to resolve module')) {
      this.log('Attempting to install missing dependencies', 'info');
      return this.runCommand('npm', ['install']);
    }

    if (error.message.includes('Transform error')) {
      this.log('Clearing Metro cache', 'info');
      return this.runCommand('npx', ['expo', 'r', '-c']);
    }

    return false;
  }

  async recoverTypeScriptError(error) {
    // TypeScript error recovery strategies
    if (error.message.includes('Cannot find module')) {
      this.log('Installing missing TypeScript dependencies', 'info');
      return this.runCommand('npm', ['install', '@types/node']);
    }

    return false;
  }

  async recoverAndroidError(error) {
    // Android error recovery strategies
    if (error.message.includes('BUILD FAILED')) {
      this.log('Cleaning Android build', 'info');
      return this.runCommand('./gradlew', ['clean'], path.join(this.options.projectRoot, 'android'));
    }

    return false;
  }

  async recoveriOSError(error) {
    // iOS error recovery strategies
    if (error.message.includes('BUILD FAILED')) {
      this.log('Cleaning iOS build', 'info');
      const iosDir = path.join(this.options.projectRoot, 'ios');
      return this.runCommand('rm', ['-rf', 'build'], iosDir);
    }

    return false;
  }

  runCommand(command, args, cwd = this.options.projectRoot) {
    return new Promise((resolve) => {
      const process = spawn(command, args, { cwd, stdio: 'pipe' });
      
      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });
    });
  }

  broadcastToClients(message) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.log(logEntry);

    // Write to log file
    fs.appendFileSync(this.logFile, logEntry + '\n');

    // Rotate log file if it gets too large
    this.rotateLogFile();
  }

  logError(error) {
    const logEntry = `[${error.timestamp}] [ERROR] ${error.source}: ${error.message} (Severity: ${error.severity})`;
    fs.appendFileSync(this.errorLogFile, logEntry + '\n');
  }

  rotateLogFile() {
    try {
      const stats = fs.statSync(this.logFile);
      if (stats.size > this.options.maxLogSize) {
        const rotatedFile = this.logFile.replace('.log', `-${Date.now()}.log`);
        fs.renameSync(this.logFile, rotatedFile);
        this.log('Log file rotated', 'info');
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }

  getMetrics() {
    return {
      ...this.buildMetrics,
      uptime: this.buildMetrics.startTime ? Date.now() - this.buildMetrics.startTime.getTime() : 0,
      processCount: this.monitoredProcesses.size
    };
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new RealTimeBuildMonitor({
    projectRoot: process.cwd(),
    logLevel: process.env.LOG_LEVEL || 'info',
    enableWebSocket: process.env.ENABLE_WS !== 'false',
    wsPort: parseInt(process.env.WS_PORT) || 8081
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down monitor...');
    monitor.stop();
    process.exit(0);
  });

  monitor.start();

  // Log metrics every minute
  setInterval(() => {
    const metrics = monitor.getMetrics();
    console.log(`\n=== Build Monitor Metrics ===`);
    console.log(`Uptime: ${Math.floor(metrics.uptime / 1000)}s`);
    console.log(`Errors: ${metrics.errors.length}`);
    console.log(`Warnings: ${metrics.warnings.length}`);
    console.log(`Processes: ${metrics.processCount}`);
    console.log(`=============================\n`);
  }, 60000);
}

module.exports = RealTimeBuildMonitor;