# Weighter telegram bot
Bot to save your daily weight via telegram

# Commands
```
/peso <peso> - Upserts weight of the day, calling again with the weight already saves updates the weight.
/historico - Shows history of weights saved for the user.
```

# Installation
Clone 
```
git clone https://github.com/abnerfs/weighter-telegram/
```

Rename .env.sample to .env and provide the necessary info, telegram token, mongodb url and mongodb database name.
Build using 
```
npm run build
```
Start
```
npm start
```
