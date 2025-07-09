#!/usr/bin/env python
"""
Script para verificar la disponibilidad de las versiones especificadas en requirements.txt
"""
import subprocess
import sys
import re

def parse_requirements(filename='requirements.txt'):
    """Parse requirements file and extract package specifications."""
    packages = []
    try:
        with open(filename, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Skip -r includes
                if line.startswith('-r'):
                    continue
                # Extract package name and version
                if '==' in line:
                    # Handle extras like celery[redis]
                    match = re.match(r'^([a-zA-Z0-9\-_]+)(?:\[[^\]]+\])?==(.+)$', line)
                    if match:
                        packages.append((match.group(1), match.group(2)))
    except FileNotFoundError:
        print(f"Error: {filename} not found")
        sys.exit(1)
    return packages

def check_package_version(package, version):
    """Check if a specific version of a package is available."""
    cmd = [sys.executable, '-m', 'pip', 'index', 'versions', package]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            output = result.stdout
            # Check if the specific version exists
            if version in output:
                return True, f"✓ {package}=={version} - Available"
            else:
                # Extract available versions
                versions_match = re.search(r'Available versions: (.+)', output)
                if versions_match:
                    available = versions_match.group(1).strip()
                    # Get latest stable version
                    versions = [v.strip() for v in available.split(',')]
                    stable_versions = [v for v in versions if not any(x in v for x in ['a', 'b', 'rc', 'dev'])]
                    latest = stable_versions[0] if stable_versions else versions[0]
                    return False, f"✗ {package}=={version} - Not found. Latest: {latest}"
                else:
                    return False, f"✗ {package}=={version} - Version not found"
        else:
            return False, f"✗ {package} - Package not found in PyPI"
    except Exception as e:
        return False, f"✗ {package} - Error checking: {str(e)}"

def main():
    print("Checking package versions in requirements.txt...\n")
    
    packages = parse_requirements()
    errors = []
    
    for package, version in packages:
        success, message = check_package_version(package, version)
        print(message)
        if not success:
            errors.append(message)
    
    if errors:
        print(f"\n❌ Found {len(errors)} errors:")
        for error in errors:
            print(f"  {error}")
        sys.exit(1)
    else:
        print("\n✅ All package versions are available!")
        sys.exit(0)

if __name__ == "__main__":
    main()
