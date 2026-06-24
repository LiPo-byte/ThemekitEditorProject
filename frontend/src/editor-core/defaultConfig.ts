export const defaultCropProps = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
};
export const WidgetDefaultConfig = {
    Time_LayoutType_0: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "sizes":[
                {
                    "size":1,
                    "name": "Time-IOS-Small",
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "padding":16,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":20,
                        "textHeight":18,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":10,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":16,
                        "textHeight":15,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time-IOS-Medium",
                    "padding":16,
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":25,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":14,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":18,
                        "textHeight":16,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time-IOS-Large",
                    "padding":16,
                    "radius": 28,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":38,
                        "textHeight":33,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":20,
                        "bottomSpacing":20
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":30,
                        "textHeight":26,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        },
        android: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "sizes":[
                {
                    "size":1,
                    "name": "Time-Android-Small",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding": 16,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":20,
                        "textHeight":18,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":10,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":16,
                        "textHeight":15,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time-Android-Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":25,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":14,
                        "bottomSpacing":10
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":18,
                        "textHeight":16,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time-Android-Large",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    },
                    "day" :{
                        "font":"AvenirNext-Bold",
                        "textSize":38,
                        "textHeight":33,
                        "textColor":"#000000",
                        "alpha":1.0,
                          "topSpacing":20,
                        "bottomSpacing":20
                    },
                    "date":{
                        "font":"AvenirNext-Bold",
                        "textSize":30,
                        "textHeight":26,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        }
    },
    Time_LayoutType_0_1: {
        ios: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "sizes":[
                {
                    "size":1,
                    "name": "Time-IOS-Small",
                    "layoutType": '0-1',
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding":16,
                    "time":{
                        "font":"AvenirNext-HeavyItalic",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time-IOS-Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": '0-1',
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time-IOS-Large",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": '0-1',
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        },
        android: {
          "version":0,
          "isLockScreen":false,
          "type":1,
          "textAlignment":1,
          "sizes":[
                {
                    "size":1,
                    "name": "Time-Android-Small",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": '0-1',
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":28,
                        "textHeight":24,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":2,
                    "name": "Time-Android-Medium",
                    "padding":16,
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "layoutType": '0-1',
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":32,
                        "textHeight":29,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                },
                {
                    "size":3,
                    "name": "Time-Android-Large",
                    "source": "",
                    "crop_props": defaultCropProps,
                    "radius": 28,
                    "padding":16,
                    "layoutType": '0-1',
                    "time":{
                        "font":"AvenirNext-Bold",
                        "textSize":54,
                        "textHeight":47,
                        "textColor":"#000000",
                        "alpha":1.0
                    }
                }
          ]
        }
    },
}
export const IconPackDefaultConfig = {
    apps: {
        zoom: {
            name: 'zoom',
            "crop_props": defaultCropProps,
            source: 'zoom.svg'
        },
        amazon: { name: 'Amazon', crop_props: defaultCropProps, source: 'amazon.svg' },
        app_store: { name: 'App Store', crop_props: defaultCropProps, source: 'app_store.svg' },
        apple_store: { name: 'Apple Store', crop_props: defaultCropProps, source: 'apple_store.svg' },
        apple_tv: { name: 'Apple TV', crop_props: defaultCropProps, source: 'apple_tv.svg' },
        books: { name: 'Books', crop_props: defaultCropProps, source: 'books.svg' },
        calculator: { name: 'Calculator', crop_props: defaultCropProps, source: 'calculator.svg' },
        calendar: { name: 'Calendar', crop_props: defaultCropProps, source: 'calendar.svg' },
        camera: { name: 'Camera', crop_props: defaultCropProps, source: 'camera.svg' },
        chrome: { name: 'Chrome', crop_props: defaultCropProps, source: 'chrome.svg' },
        clips: { name: 'Clips', crop_props: defaultCropProps, source: 'clips.svg' },
        clock: { name: 'Clock', crop_props: defaultCropProps, source: 'clock.svg' },
        contacts: { name: 'Contacts', crop_props: defaultCropProps, source: 'contacts.svg' },
        facebook: { name: 'Facebook', crop_props: defaultCropProps, source: 'facebook.svg' },
        facetime: { name: 'Facetime', crop_props: defaultCropProps, source: 'facetime.svg' },
        files: { name: 'Files', crop_props: defaultCropProps, source: 'files.svg' },
        find_my_iphone: { name: 'Find My iPhone', crop_props: defaultCropProps, source: 'find_my_iphone.svg' },
        gmail: { name: 'Gmail', crop_props: defaultCropProps, source: 'gmail.svg' },
        google_maps: { name: 'Google Maps', crop_props: defaultCropProps, source: 'google_maps.svg' },
        google_photos: { name: 'Google Photos', crop_props: defaultCropProps, source: 'google_photos.svg' },
        google: { name: 'Google', crop_props: defaultCropProps, source: 'google.svg' },
        health: { name: 'Health', crop_props: defaultCropProps, source: 'health.svg' },
        imovie: { name: 'iMovie', crop_props: defaultCropProps, source: 'imovie.svg' },
        instagram: { name: 'Instagram', crop_props: defaultCropProps, source: 'instagram.svg' },
        itunes: { name: 'iTunes', crop_props: defaultCropProps, source: 'itunes.svg' },
        line: { name: 'Line', crop_props: defaultCropProps, source: 'line.svg' },
        mail: { name: 'Mail', crop_props: defaultCropProps, source: 'mail.svg' },
        maps: { name: 'Maps', crop_props: defaultCropProps, source: 'maps.svg' },
        messages: { name: 'Messages', crop_props: defaultCropProps, source: 'messages.svg' },
        messenger: { name: 'Messenger', crop_props: defaultCropProps, source: 'messenger.svg' },
        music: { name: 'Music', crop_props: defaultCropProps, source: 'music.svg' },
        netflix: { name: 'Netflix', crop_props: defaultCropProps, source: 'netflix.svg' },
        notes: { name: 'Notes', crop_props: defaultCropProps, source: 'notes.svg' },
        phone: { name: 'Phone', crop_props: defaultCropProps, source: 'phone.svg' },
        photos: { name: 'Photos', crop_props: defaultCropProps, source: 'photos.svg' },
        pinterest: { name: 'Pinterest', crop_props: defaultCropProps, source: 'pinterest.svg' },
        podcasts: { name: 'Podcasts', crop_props: defaultCropProps, source: 'podcasts.svg' },
        reddit: { name: 'Reddit', crop_props: defaultCropProps, source: 'reddit.svg' },
        reminders: { name: 'Reminders', crop_props: defaultCropProps, source: 'reminders.svg' },
        safari: { name: 'Safari', crop_props: defaultCropProps, source: 'safari.svg' },
        settings: { name: 'Settings', crop_props: defaultCropProps, source: 'settings.svg' },
        snapchat: { name: 'Snapchat', crop_props: defaultCropProps, source: 'snapchat.svg' },
        spotify: { name: 'Spotify', crop_props: defaultCropProps, source: 'spotify.svg' },
        telegram: { name: 'Telegram', crop_props: defaultCropProps, source: 'telegram.svg' },
        tiktok: { name: 'Tiktok', crop_props: defaultCropProps, source: 'tiktok.svg' },
        tumblr: { name: 'Tumblr', crop_props: defaultCropProps, source: 'tumblr.svg' },
        twitch: { name: 'Twitch', crop_props: defaultCropProps, source: 'twitch.svg' },
        twitter: { name: 'Twitter', crop_props: defaultCropProps, source: 'twitter.svg' },
        wallet: { name: 'Wallet', crop_props: defaultCropProps, source: 'wallet.svg' },
        watch: { name: 'Watch', crop_props: defaultCropProps, source: 'watch.svg' },
        weather: { name: 'Weather', crop_props: defaultCropProps, source: 'weather.svg' },
        whatsapp: { name: 'WhatsApp', crop_props: defaultCropProps, source: 'whatsapp.svg' },
        youtube: { name: 'Youtube', crop_props: defaultCropProps, source: 'youtube.svg' },
    }
}