#!/bin/bash

# Start Complete Build Monitoring System
# Orchestrates all monitoring components for comprehensive build oversight

set -e

# Configuration
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
MONITOR_DIR="$PROJECT_ROOT/scripts/build/monitor"
LOGS_DIR="$PROJECT_ROOT/logs/monitor"
PID_FILE="$LOGS_DIR/monitor.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure directories exist
mkdir -p "$LOGS_DIR"

# Check if monitoring is already running
if [[ -f "$PID_FILE" ]]; then
    EXISTING_PID=$(cat "$PID_FILE")
    if ps -p "$EXISTING_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Monitoring system is already running (PID: $EXISTING_PID)${NC}"
        echo "Use 'stop-monitoring.sh' to stop it first, or 'restart-monitoring.sh' to restart."
        exit 1
    else
        echo -e "${YELLOW}Removing stale PID file${NC}"
        rm -f "$PID_FILE"
    fi
fi

echo -e "${BLUE}🚀 Starting Mobile Mechanic Build Monitoring System${NC}"
echo "=================================================="

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}❌ npm not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    
    # Check if monitoring scripts exist
    local required_scripts=(
        "$MONITOR_DIR/real-time-monitor.js"
        "$MONITOR_DIR/predictive-analyzer.js"
        "$MONITOR_DIR/dashboard.html"
    )
    
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            echo -e "${RED}❌ Missing script: $script${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}✅ All monitoring scripts found${NC}"
    
    # Install dependencies if needed
    if [[ ! -d "$PROJECT_ROOT/node_modules/ws" ]]; then
        echo -e "${YELLOW}Installing WebSocket dependency...${NC}"
        cd "$PROJECT_ROOT"
        npm install ws
    fi
}

# Function to start real-time monitor
start_real_time_monitor() {
    echo -e "${BLUE}Starting real-time monitor...${NC}"
    
    local monitor_log="$LOGS_DIR/real-time-monitor.log"
    
    # Start real-time monitor in background
    node "$MONITOR_DIR/real-time-monitor.js" > "$monitor_log" 2>&1 &
    local monitor_pid=$!
    
    # Wait a moment to see if it started successfully
    sleep 2
    if ps -p "$monitor_pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Real-time monitor started (PID: $monitor_pid)${NC}"
        echo "$monitor_pid" > "$LOGS_DIR/real-time-monitor.pid"
        return 0
    else
        echo -e "${RED}❌ Failed to start real-time monitor${NC}"
        cat "$monitor_log"
        return 1
    fi
}

# Function to start predictive analyzer
start_predictive_analyzer() {
    echo -e "${BLUE}Starting predictive analyzer...${NC}"
    
    local analyzer_log="$LOGS_DIR/predictive-analyzer.log"
    
    # Start predictive analyzer in background
    node "$MONITOR_DIR/predictive-analyzer.js" > "$analyzer_log" 2>&1 &
    local analyzer_pid=$!
    
    # Wait a moment to see if it started successfully
    sleep 2
    if ps -p "$analyzer_pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Predictive analyzer started (PID: $analyzer_pid)${NC}"
        echo "$analyzer_pid" > "$LOGS_DIR/predictive-analyzer.pid"
        return 0
    else
        echo -e "${RED}❌ Failed to start predictive analyzer${NC}"
        cat "$analyzer_log"
        return 1
    fi
}

# Function to start dashboard server
start_dashboard_server() {
    echo -e "${BLUE}Starting dashboard server...${NC}"
    
    local dashboard_log="$LOGS_DIR/dashboard-server.log"
    
    # Create simple HTTP server for dashboard
    cat > "$LOGS_DIR/dashboard-server.js" << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DASHBOARD_PATH = process.argv[2];

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/dashboard') {
        fs.readFile(DASHBOARD_PATH, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading dashboard');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Dashboard server shutting down...');
    server.close(() => {
        process.exit(0);
    });
});
EOF
    
    # Start dashboard server in background
    node "$LOGS_DIR/dashboard-server.js" "$MONITOR_DIR/dashboard.html" > "$dashboard_log" 2>&1 &
    local dashboard_pid=$!
    
    # Wait a moment to see if it started successfully
    sleep 2
    if ps -p "$dashboard_pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Dashboard server started (PID: $dashboard_pid)${NC}"
        echo -e "${GREEN}🌐 Dashboard available at: http://localhost:8080${NC}"
        echo "$dashboard_pid" > "$LOGS_DIR/dashboard-server.pid"
        return 0
    else
        echo -e "${RED}❌ Failed to start dashboard server${NC}"
        cat "$dashboard_log"
        return 1
    fi
}

# Function to create master PID file
create_master_pid() {
    local pids=""
    
    if [[ -f "$LOGS_DIR/real-time-monitor.pid" ]]; then
        pids="$pids $(cat "$LOGS_DIR/real-time-monitor.pid")"
    fi
    
    if [[ -f "$LOGS_DIR/predictive-analyzer.pid" ]]; then
        pids="$pids $(cat "$LOGS_DIR/predictive-analyzer.pid")"
    fi
    
    if [[ -f "$LOGS_DIR/dashboard-server.pid" ]]; then
        pids="$pids $(cat "$LOGS_DIR/dashboard-server.pid")"
    fi
    
    echo "$pids" > "$PID_FILE"
}

# Function to show status
show_status() {
    echo ""
    echo -e "${GREEN}📊 Monitoring System Status:${NC}"
    echo "================================"
    
    # Real-time monitor
    if [[ -f "$LOGS_DIR/real-time-monitor.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/real-time-monitor.pid")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Real-time Monitor: Running (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ Real-time Monitor: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ Real-time Monitor: Not started${NC}"
    fi
    
    # Predictive analyzer
    if [[ -f "$LOGS_DIR/predictive-analyzer.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/predictive-analyzer.pid")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Predictive Analyzer: Running (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ Predictive Analyzer: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ Predictive Analyzer: Not started${NC}"
    fi
    
    # Dashboard server
    if [[ -f "$LOGS_DIR/dashboard-server.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/dashboard-server.pid")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Dashboard Server: Running (PID: $pid)${NC}"
            echo -e "${BLUE}   🌐 Available at: http://localhost:8080${NC}"
        else
            echo -e "${RED}❌ Dashboard Server: Not running${NC}"
        fi
    else
        echo -e "${RED}❌ Dashboard Server: Not started${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📁 Log files location: $LOGS_DIR${NC}"
    echo -e "${BLUE}🎛️  WebSocket monitor: ws://localhost:8081${NC}"
    echo ""
}

# Function to setup log rotation
setup_log_rotation() {
    echo -e "${BLUE}Setting up log rotation...${NC}"
    
    # Create logrotate configuration
    cat > "$LOGS_DIR/logrotate.conf" << EOF
$LOGS_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644
}
EOF
    
    echo -e "${GREEN}✅ Log rotation configured${NC}"
}

# Function to create monitoring wrapper script
create_monitoring_wrapper() {
    cat > "$PROJECT_ROOT/monitor" << 'EOF'
#!/bin/bash
# Quick monitoring system controller

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/scripts/build/monitor/start-monitoring.sh"

case "$1" in
    "start")
        bash "$SCRIPT_DIR/scripts/build/monitor/start-monitoring.sh"
        ;;
    "stop")
        bash "$SCRIPT_DIR/scripts/build/monitor/stop-monitoring.sh"
        ;;
    "restart")
        bash "$SCRIPT_DIR/scripts/build/monitor/restart-monitoring.sh"
        ;;
    "status")
        bash "$SCRIPT_DIR/scripts/build/monitor/status-monitoring.sh"
        ;;
    "dashboard")
        echo "Opening dashboard at http://localhost:8080"
        if command -v xdg-open >/dev/null 2>&1; then
            xdg-open http://localhost:8080
        elif command -v open >/dev/null 2>&1; then
            open http://localhost:8080
        else
            echo "Please open http://localhost:8080 in your browser"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|dashboard}"
        echo ""
        echo "Commands:"
        echo "  start     - Start monitoring system"
        echo "  stop      - Stop monitoring system"
        echo "  restart   - Restart monitoring system"
        echo "  status    - Show monitoring status"
        echo "  dashboard - Open monitoring dashboard"
        exit 1
        ;;
esac
EOF
    
    chmod +x "$PROJECT_ROOT/monitor"
    echo -e "${GREEN}✅ Created quick access script: ./monitor${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Mobile Mechanic Build Monitoring System${NC}"
    echo -e "${BLUE}Starting comprehensive build monitoring...${NC}"
    echo ""
    
    # Check dependencies
    check_dependencies
    echo ""
    
    # Setup log rotation
    setup_log_rotation
    echo ""
    
    # Start components
    local start_success=true
    
    if ! start_real_time_monitor; then
        start_success=false
    fi
    
    if ! start_predictive_analyzer; then
        start_success=false
    fi
    
    if ! start_dashboard_server; then
        start_success=false
    fi
    
    if [[ "$start_success" == "true" ]]; then
        create_master_pid
        create_monitoring_wrapper
        show_status
        
        echo -e "${GREEN}🎉 Monitoring system started successfully!${NC}"
        echo ""
        echo -e "${YELLOW}Quick start guide:${NC}"
        echo "1. View dashboard: http://localhost:8080"
        echo "2. Check status: ./monitor status"
        echo "3. View logs: tail -f $LOGS_DIR/*.log"
        echo "4. Stop monitoring: ./monitor stop"
        echo ""
        echo -e "${BLUE}The system will now continuously monitor your builds and provide:${NC}"
        echo "• Real-time error detection and recovery"
        echo "• Predictive failure analysis"
        echo "• Automated remediation suggestions"
        echo "• Build performance metrics"
        echo "• Historical trend analysis"
        echo ""
        echo -e "${GREEN}Happy building! 🚀${NC}"
        
    else
        echo -e "${RED}❌ Failed to start some monitoring components${NC}"
        echo "Check the log files in $LOGS_DIR for more details"
        exit 1
    fi
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Monitoring startup interrupted${NC}"; exit 1' INT

# Run main function
main "$@"