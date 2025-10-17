#!/bin/bash

# GLPI n8n Node Development Helper Script
# This script helps with common development tasks for the GLPI n8n node

echo "======================================"
echo "GLPI n8n Node Development Helper"
echo "======================================"
echo ""

# Function to display menu
show_menu() {
    echo "Please select an option:"
    echo "1) Build the node"
    echo "2) Install in local n8n (~/.n8n)"
    echo "3) Run development mode"
    echo "4) Run linter"
    echo "5) Fix linting issues"
    echo "6) Clean build files"
    echo "7) Update dependencies"
    echo "8) Generate new OpenAPI spec from GLPI instance"
    echo "9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice
}

# Function to build the node
build_node() {
    echo "Building GLPI node..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "✓ Build successful!"
    else
        echo "✗ Build failed. Please check the errors above."
    fi
}

# Function to install in local n8n
install_local() {
    echo "Installing GLPI node in local n8n..."
    
    # Build first
    npm run build
    
    if [ $? -eq 0 ]; then
        # Create symlink
        npm link
        
        # Link in n8n directory
        if [ -d "$HOME/.n8n" ]; then
            cd $HOME/.n8n
            npm link n8n-nodes-glpi
            echo "✓ Node installed in local n8n!"
            echo "Please restart n8n to see the GLPI node."
            cd -
        else
            echo "✗ n8n directory not found at ~/.n8n"
            echo "Please ensure n8n is installed locally."
        fi
    else
        echo "✗ Build failed. Please fix errors before installing."
    fi
}

# Function to run development mode
run_dev() {
    echo "Starting development mode..."
    echo "This will watch for changes and rebuild automatically."
    npm run dev
}

# Function to run linter
run_lint() {
    echo "Running linter..."
    npm run lint
}

# Function to fix linting issues
fix_lint() {
    echo "Fixing linting issues..."
    npm run lint:fix
}

# Function to clean build files
clean_build() {
    echo "Cleaning build files..."
    rm -rf dist/
    rm -f tsconfig.tsbuildinfo
    echo "✓ Build files cleaned!"
}

# Function to update dependencies
update_deps() {
    echo "Updating dependencies..."
    npm update
    echo "✓ Dependencies updated!"
}

# Function to fetch OpenAPI spec from GLPI
fetch_openapi() {
    echo "Fetching OpenAPI specification from GLPI instance..."
    echo ""
    read -p "Enter your GLPI URL (e.g., https://demo.glpi-project.org/glpi): " glpi_url
    
    # Check if GLPI 10.1+ with modern API
    echo "Checking for modern API (GLPI 10.1+)..."
    
    # Try to fetch from the modern API endpoint
    modern_api_url="${glpi_url}/api.php/swagger"
    
    echo "Attempting to fetch from: $modern_api_url"
    
    # Use curl to fetch the OpenAPI spec
    curl -s -o temp_openapi.json "${modern_api_url}/openapi.json" 2>/dev/null
    
    if [ -s temp_openapi.json ]; then
        # Check if it's valid JSON
        if python3 -m json.tool temp_openapi.json > /dev/null 2>&1; then
            # Pretty print and save
            python3 -m json.tool temp_openapi.json > nodes/Glpi/openapi.json
            rm temp_openapi.json
            echo "✓ OpenAPI specification fetched successfully!"
            echo "Saved to: nodes/Glpi/openapi.json"
            echo ""
            echo "Please rebuild the node to apply changes:"
            echo "npm run build"
        else
            echo "✗ Downloaded file is not valid JSON"
            rm temp_openapi.json
            echo ""
            echo "Your GLPI instance might not have the modern API."
            echo "GLPI 10.1+ is required for automatic OpenAPI export."
            echo "For older versions, you'll need to manually update the openapi.json file."
        fi
    else
        echo "✗ Could not fetch OpenAPI specification"
        echo ""
        echo "Possible reasons:"
        echo "1. GLPI version is older than 10.1"
        echo "2. Modern API is not enabled"
        echo "3. Network connection issue"
        echo "4. Invalid GLPI URL"
        echo ""
        echo "For GLPI versions before 10.1, you'll need to manually"
        echo "create the OpenAPI specification based on the API documentation."
    fi
}

# Main loop
while true
do
    show_menu
    case $choice in
        1)
            build_node
            ;;
        2)
            install_local
            ;;
        3)
            run_dev
            ;;
        4)
            run_lint
            ;;
        5)
            fix_lint
            ;;
        6)
            clean_build
            ;;
        7)
            update_deps
            ;;
        8)
            fetch_openapi
            ;;
        9)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
