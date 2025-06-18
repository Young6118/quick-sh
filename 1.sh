#!/bin/sh
 
git filter-branch --env-filter '
 
# The old Email
OLD_EMAIL="yang.zhou02@mihoyo.com"
# The new username
CORRECT_NAME="Young6118"
# The new Email
CORRECT_EMAIL="zy1308536472@gmail.com"
 
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags