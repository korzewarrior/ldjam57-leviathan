#!/bin/bash

# Script to remove comments from JS, HTML, and CSS files

echo "Starting comment removal process..."

# Process JavaScript files - handling both single-line and multi-line comments
echo "Processing JavaScript files..."
find . -name "*.js" -type f | while read file; do
    echo "Removing comments from $file"
    # Use a temporary file to ensure we don't corrupt files
    tmp_file=$(mktemp)
    # First pass: Remove single-line comments
    perl -pe 's/\/\/.*$//' "$file" > "$tmp_file"
    # Second pass: Remove multi-line comments (handles comments across multiple lines)
    perl -0777 -pe 's/\/\*.*?\*\///gs' "$tmp_file" > "$file"
    rm "$tmp_file"
done

# Process HTML files - including multi-line HTML comments
echo "Processing HTML files..."
find . -name "*.html" -type f | while read file; do
    echo "Removing comments from $file"
    tmp_file=$(mktemp)
    # Remove HTML comments (handles comments across multiple lines)
    perl -0777 -pe 's/<!--.*?-->//gs' "$file" > "$tmp_file"
    cat "$tmp_file" > "$file"
    rm "$tmp_file"
done

# Process CSS files - including multi-line CSS comments
echo "Processing CSS files..."
find . -name "*.css" -type f | while read file; do
    echo "Removing comments from $file"
    tmp_file=$(mktemp)
    # Remove CSS comments (handles comments across multiple lines)
    perl -0777 -pe 's/\/\*.*?\*\///gs' "$file" > "$tmp_file"
    cat "$tmp_file" > "$file"
    rm "$tmp_file"
done

echo "Comment removal complete!" 