#!/bin/bash
clear

# Export GITHUB_PAT for git commands
export GITHUB_PAT="$GITHUB_PAT"

while true; do
    echo "GitHub Manager"
    echo "1. Push to GitHub"
    echo "2. Check Status"
    echo "3. Setup Credentials"
    echo "4. View Repository"
    echo "5. Exit"
    echo -n "Select: "
    read choice

    case $choice in
        1)
            echo "Pushing to GitHub..."
            git add .
            echo -n "Enter commit message: "
            read commit_message
            
            # Set credential helper for this operation
            git -c credential.helper='!f() { echo username=token; echo password=$GITHUB_PAT; }; f' commit -m "$commit_message"
            git -c credential.helper='!f() { echo username=token; echo password=$GITHUB_PAT; }; f' push origin main
            echo "Press Enter to continue..."
            read
            ;;
        2)
            echo "Checking git status..."
            git status
            echo "Press Enter to continue..."
            read
            ;;
        3)
            echo "Setting up git credentials..."
            echo -n "Enter your name: "
            read user_name
            echo -n "Enter your email: "
            read user_email
            git config --global user.name "$user_name"
            git config --global user.email "$user_email"
            
            # Setup credential helper
            git config --global credential.helper '!f() { echo username=token; echo password=$GITHUB_PAT; }; f'
            echo "Git credentials configured!"
            echo "Press Enter to continue..."
            read
            ;;
        4)
            echo "Repository information:"
            echo "Remote repositories:"
            git remote -v
            echo ""
            echo "Branches:"
            git branch -a
            echo "Press Enter to continue..."
            read
            ;;
        5)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            echo "Press Enter to continue..."
            read
            ;;
    esac
    clear
done
