'use strict';
// create and call anonymous function for scope purposes
// not sure if necessary but it's probably for the best
(function() {
  const defaultConfig = {
    distractions: [
      {
				name: 'news.ycombinator.com',
        enabled: true
      },
      {
				name: 'youtube.com',
        enabled: true
      },
      {
				name: 'reddit.com',
        enabled: true
      },
      {
				name: 'tumblr.com',
        enabled: true
      },
      {
				name: 'facebook.com',
        enabled: true
      },
      {
				name: 'messenger.com',
        enabled: true
      },
      {
				name: 'twitter.com',
        enabled: true
      }
    ],
    focus: 'http://inbox.google.com/',
    isWorking: false,
    breakInfo: {
      isOnBreak: false,
      breakStart: 0, // the beginning of time (kinda)
      breakLength: 0
    },
  	// for siteIcons, please include icon without border
  	siteIcons: {
  		"amazon": "amazon",
  		"delicious": "delicious",
  		"deviantart": "deviantart",
  		"digg": "digg",
  		"dribble": "dribble",
  		"facebook": "facebook",
  		"flickr": "flickr",
  		"forumbee": "forumbee",
  		"foursquare": "foursquare",
  		"getpocket": "getpocket",
  		"plus.google": "google-plus",
  		"gratipay": "gratiplay",
  		"instagram": "instagram",
  		"last.fm": "lastfm",
  		"medium": "medium",
  		"messenger": "comments-o",
  		"pinterest": "pinterest",
  		"reddit": "reddit-alien",
  		"skype": "skype",
  		"slack": "slack",
  		"snapchat": "snapchat-ghost",
  		"steampowered": "steam",
  		"stumbleupon": "stumbleupon",
  		"tumblr": "tumblr",
  		"twitter": "twitter",
  		"twitch": "twitch",
  		"vimeo": "vimeo",
  		"vine": "vine",
  		"wechat": "wechat",
  		"whatsapp": "whatsapp",
  		"wordpress": "wordpress",
  		"xing": "xing",
  		"yahoo": "yahoo",
  		"ycombinator": "hacker-news",
  		"youtube": "youtube-play"
  	}
  }

  class RedirectBackgroundProcess {
    constructor() {
      this.config = {}
      this.tabs = {}

      // check if break is over every 5 seconds
      // maybe this isn't often enough, it's not really a super intense
      // function so like it doesn't matter a lot
      // delete this comment if you think it's a good amount of time
      let update = setInterval(() => this.checkForBreakEnd(), 5 * 1000)

      chrome.storage.sync.get(defaultConfig, (data) => {
		this.config = data

        // setting the values we just got will make sure
        // we have the defaultConfig saved
        chrome.storage.sync.set(this.config);

        // query without any constraints to get an array of all tabs
        // ALSO: do this after we get the config
        // because config and queries happen asynchronously
        chrome.tabs.query({}, (tabs) => {
          for (let i in tabs) {
            this.addTabEntry(tabs[i])
            this.checkForDistraction(tabs[i])
          }
        })
      })

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync')
          for (let key in changes)
            this.config[key] = changes[key].newValue
      })

      // whenever a new tab is created we need to have metadata on it
      chrome.tabs.onCreated.addListener((tab) => {
        this.addTabEntry(tab)
      })

      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (tab.status === 'loading') {
          this.checkForDistraction(tab)
        }
      })
    }

    checkForBreakEnd() {
      if (Date.now() > this.config.breakInfo.breakStart + this.config.breakInfo.breakLength)
        if (this.config.breakInfo.isOnBreak)
          // if they're on break then take them off break
          chrome.storage.sync.set('breakInfo', {
            isOnBreak: false,
            breakStart: 0,
            breakLength : 0
          })
    }

    addTabEntry(tab) {
      // add more info here if we need more tab-specific metadata
      this.tabs[tab.id] = {
        distracted: false
      }
    }

    checkForDistraction(tab) {
      if (!this.config.isWorking) return
      if (this.config.breakInfo.isOnBreak) return

      if (this.isDistracting(tab.url)) {
        this.tabs[tab.id].distracted = true

        this.sendRedirectMessage(tab.id)

      } else if (this.tabs[tab.id].distracted) {

        this.sendCreateUIMessage(tab.id)
      }
    }

    isDistracting(url) {
      let host = url.match(/\/([a-zA-Z0-9\_\.\-\~]+)\//)[1]
      for(let i in this.config.distractions) {
        if (host.includes(this.config.distractions[i].name) &&
            this.config.distractions[i].enabled)
          return true
      }
      return false
    }

    sendRedirectMessage(tabId) {
      console.log('sending the redirect message');
      chrome.tabs.sendMessage(tabId, { redirect: this.config.focus }, (response) => {console.log('response',response);})
    }

    sendCreateUIMessage(tabId) {
      console.log('sending the ui creation message');
      chrome.tabs.sendMessage(tabId, { isDistracted: true }, (response) => {console.log('response',response);})
    }
  }

  new RedirectBackgroundProcess()
})()
