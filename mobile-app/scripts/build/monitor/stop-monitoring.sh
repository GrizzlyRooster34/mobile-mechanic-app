#!/bin/bash

# Stop Build Monitoring System
# Gracefully shuts down all monitoring components

set -e

# Configuration
PROJECT_ROOT="/home/big_d/mobile-mechanic-app/mobile-app"
LOGS_DIR="$PROJECT_ROOT/logs/monitor"
PID_FILE="$LOGS_DIR/monitor.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Mobile Mechanic Build Monitoring System${NC}"
echo "=================================================="

# Function to stop a process gracefully
stop_process() {
    local pid=$1
    local name=$2
    local timeout=${3:-10}
    
    if ! ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $name is not running (PID: $pid)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Stopping $name (PID: $pid)...${NC}"
    
    # Try graceful shutdown first
    kill -TERM "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while [[ $count -lt $timeout ]] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        ((count++))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Forcing shutdown of $name...${NC}"
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to stop $name${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $name stopped successfully${NC}"
        return 0
    fi
}

# Function to stop all monitoring components
stop_monitoring_components() {
    local pids_stopped=0
    local pids_failed=0
    
    # Stop real-time monitor
    if [[ -f "$LOGS_DIR/real-time-monitor.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/real-time-monitor.pid")
        if stop_process "$pid" "Real-time Monitor"; then
            rm -f "$LOGS_DIR/real-time-monitor.pid"
            ((pids_stopped++))
        else
            ((pids_failed++))
        fi
    else
        echo -e "${YELLOW}⚠️  Real-time Monitor PID file not found${NC}"
    fi
    
    # Stop predictive analyzer
    if [[ -f "$LOGS_DIR/predictive-analyzer.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/predictive-analyzer.pid")
        if stop_process "$pid" "Predictive Analyzer"; then
            rm -f "$LOGS_DIR/predictive-analyzer.pid"
            ((pids_stopped++))
        else
            ((pids_failed++))
        fi
    else
        echo -e "${YELLOW}⚠️  Predictive Analyzer PID file not found${NC}"
    fi
    
    # Stop dashboard server
    if [[ -f "$LOGS_DIR/dashboard-server.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/dashboard-server.pid")
        if stop_process "$pid" "Dashboard Server"; then
            rm -f "$LOGS_DIR/dashboard-server.pid"
            rm -f "$LOGS_DIR/dashboard-server.js" # Remove temporary server file
            ((pids_stopped++))
        else
            ((pids_failed++))
        fi
    else
        echo -e "${YELLOW}⚠️  Dashboard Server PID file not found${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📊 Shutdown Summary:${NC}"
    echo "  Processes stopped: $pids_stopped"
    echo "  Processes failed: $pids_failed"
    
    return $pids_failed
}

# Function to clean up additional processes
cleanup_additional_processes() {
    echo -e "${BLUE}🧹 Cleaning up additional processes...${NC}"
    
    # Kill any remaining monitoring processes by name
    local processes_killed=0
    
    # Find and kill real-time monitor processes
    if pgrep -f "real-time-monitor.js" > /dev/null; then
        echo -e "${YELLOW}Killing remaining real-time monitor processes...${NC}"
        pkill -f "real-time-monitor.js" || true
        ((processes_killed++))
    fi
    
    # Find and kill predictive analyzer processes
    if pgrep -f "predictive-analyzer.js" > /dev/null; then
        echo -e "${YELLOW}Killing remaining predictive analyzer processes...${NC}"
        pkill -f "predictive-analyzer.js" || true
        ((processes_killed++))
    fi
    
    # Find and kill dashboard server processes
    if pgrep -f "dashboard-server.js" > /dev/null; then
        echo -e "${YELLOW}Killing remaining dashboard server processes...${NC}"
        pkill -f "dashboard-server.js" || true
        ((processes_killed++))
    fi
    
    if [[ $processes_killed -gt 0 ]]; then
        echo -e "${GREEN}✅ Cleaned up $processes_killed additional processes${NC}"
    else
        echo -e "${GREEN}✅ No additional cleanup needed${NC}"
    fi
}

# Function to remove master PID file
cleanup_pid_files() {
    echo -e "${BLUE}🗂️  Cleaning up PID files...${NC}"
    
    # Remove master PID file
    if [[ -f "$PID_FILE" ]]; then
        rm -f "$PID_FILE"
        echo -e "${GREEN}✅ Master PID file removed${NC}"
    fi
    
    # Remove any stale PID files
    local pid_files=("$LOGS_DIR"/*.pid)
    local removed_count=0
    
    for pid_file in "${pid_files[@]}"; do
        if [[ -f "$pid_file" ]]; then
            rm -f "$pid_file"
            ((removed_count++))
        fi
    done
    
    if [[ $removed_count -gt 0 ]]; then
        echo -e "${GREEN}✅ Removed $removed_count stale PID files${NC}"
    fi
}

# Function to show final status
show_final_status() {
    echo ""
    echo -e "${BLUE}📊 Final Status Check:${NC}"
    echo "======================"
    
    local any_running=false
    
    # Check for any remaining monitoring processes
    if pgrep -f "real-time-monitor.js" > /dev/null; then
        echo -e "${RED}❌ Real-time Monitor still running${NC}"
        any_running=true
    else
        echo -e "${GREEN}✅ Real-time Monitor stopped${NC}"
    fi
    
    if pgrep -f "predictive-analyzer.js" > /dev/null; then
        echo -e "${RED}❌ Predictive Analyzer still running${NC}"
        any_running=true
    else
        echo -e "${GREEN}✅ Predictive Analyzer stopped${NC}"
    fi
    
    if pgrep -f "dashboard-server.js" > /dev/null; then
        echo -e "${RED}❌ Dashboard Server still running${NC}"
        any_running=true
    else
        echo -e "${GREEN}✅ Dashboard Server stopped${NC}"
    fi
    
    # Check if ports are still in use
    if lsof -i :8080 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 8080 still in use${NC}"
    fi
    
    if lsof -i :8081 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 8081 still in use${NC}"
    fi
    
    if [[ "$any_running" == "false" ]]; then
        echo ""
        echo -e "${GREEN}🎉 All monitoring components stopped successfully!${NC}"
        return 0
    else
        echo ""
        echo -e "${YELLOW}⚠️  Some processes may still be running${NC}"
        echo "You may need to manually kill them or restart your terminal"
        return 1
    fi
}

# Function to archive logs
archive_logs() {
    if [[ "$1" == "--archive-logs" ]]; then
        echo -e "${BLUE}📦 Archiving logs...${NC}"
        
        local archive_dir="$LOGS_DIR/archives"
        local timestamp=$(date +%Y%m%d-%H%M%S)
        local archive_name="monitoring-logs-$timestamp.tar.gz"
        
        mkdir -p "$archive_dir"
        
        # Archive log files
        if ls "$LOGS_DIR"/*.log > /dev/null 2>&1; then
            tar -czf "$archive_dir/$archive_name" -C "$LOGS_DIR" *.log
            echo -e "${GREEN}✅ Logs archived to: $archive_dir/$archive_name${NC}"
            
            # Remove original log files
            rm -f "$LOGS_DIR"/*.log
            echo -e "${GREEN}✅ Original log files cleaned up${NC}"
        else
            echo -e "${YELLOW}⚠️  No log files found to archive${NC}"
        fi
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --archive-logs    Archive log files before stopping"
    echo "  --force          Force stop all processes"
    echo "  --help           Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                        # Normal stop"
    echo "  $0 --archive-logs         # Stop and archive logs"
    echo "  $0 --force               # Force stop all processes"
}

# Main execution
main() {
    local force_stop=false
    local archive_logs_flag=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_stop=true
                shift
                ;;
            --archive-logs)
                archive_logs_flag=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check if monitoring system is running
    if [[ ! -f "$PID_FILE" ]]; then
        echo -e "${YELLOW}⚠️  Monitoring system doesn't appear to be running${NC}"
        echo "Checking for any running processes anyway..."
        cleanup_additional_processes
        cleanup_pid_files
        exit 0
    fi
    
    # Archive logs if requested
    if [[ "$archive_logs_flag" == "true" ]]; then
        archive_logs --archive-logs
        echo ""
    fi
    
    # Stop monitoring components
    if [[ "$force_stop" == "true" ]]; then
        echo -e "${YELLOW}🔨 Force stopping all processes...${NC}"
        cleanup_additional_processes
    else
        if ! stop_monitoring_components; then
            echo ""
            echo -e "${YELLOW}⚠️  Some processes failed to stop gracefully${NC}"
            echo "Attempting force cleanup..."
            cleanup_additional_processes
        fi
    fi
    
    # Clean up PID files
    cleanup_pid_files
    
    # Show final status
    local final_status
    if show_final_status; then
        final_status=0
    else
        final_status=1
    fi
    
    echo ""
    if [[ $final_status -eq 0 ]]; then
        echo -e "${GREEN}✨ Monitoring system shutdown complete${NC}"
        echo -e "${BLUE}To restart monitoring: ./scripts/build/monitor/start-monitoring.sh${NC}"
        echo -e "${BLUE}Or use the quick command: ./monitor start${NC}"
    else
        echo -e "${YELLOW}⚠️  Shutdown completed with warnings${NC}"
        echo "Some processes may still be running. Check manually if needed."
    fi
    
    exit $final_status
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Shutdown interrupted${NC}"; exit 1' INT

# Run main function
main "$@"