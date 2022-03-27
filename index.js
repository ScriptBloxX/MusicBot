// require packages
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require("ytdl-core");
const ytmpl = require('yt-mix-playlist');
var YouTube = require('youtube-node');
var yt = new YouTube();

//youtube api setting (change key @config.json)
yt.setKey(config["youtube-api"])

// stop command check
var stopByUser = false;

// online status
client.on('ready', () => {
    console.log(`logged in as ${client.user.tag}!`);
    client.user.setActivity(`${config.prefix}Music`, {
        type: "STREAMING",
        url: "http://www.atimedesign.com/webdesign/wp-content/uploads/2019/09/apple-music-note-800x420.jpg"
    });
});

// commands
client.on('message', msg => {
    const prefix = config.prefix
    const msgc = msg.content.toLowerCase()
    if (msgc === prefix + 'music') {
        msg.channel.send(musicFunction())
    }
    // guild check
    if (msg.guild !== null) {
        // music commands
        const serverQueue = queue.get(msg.guild.id);
        if ((msgc.startsWith(`${prefix}play`))) {
            stopByUser = false;
            execute(msg, serverQueue);
        } else if ((msgc.startsWith(`${prefix}skip`))) {
            skip(msg, serverQueue);
        } else if ((msgc.startsWith(`${prefix}stop`))) {
            stop(msg, serverQueue);
        } else if ((msgc.startsWith(`${prefix}list`))) {
            list(msg, serverQueue);
        } else if ((msgc.startsWith(`${prefix}loop`))) {
            loopSong(msg, serverQueue);
        }
    }
});

// embed function
function embed(barColor, title, des, img, NoField) {
    if (NoField === true) {
        const { MessageEmbed } = require('discord.js');
        const dcEmbed = new MessageEmbed()
            .setColor(barColor)
            .setTitle(title)
            .setDescription(des)
            .setThumbnail(img)
            .setTimestamp()
            .setFooter(client.user.username,client.user.avatarURL());
        return dcEmbed;
    }
}

// help commands embed
function musicFunction() {
    const { MessageEmbed } = require('discord.js');
    const dcEmbed = new MessageEmbed()
        .setColor('#F5FF6F')
        .setTitle('Music Commands')
        .setDescription('This command is still in testing phase. There may be an error.')
        .setThumbnail('https://c.tenor.com/bOR-CXcBQ8QAAAAC/djaymano-dj.gif')
        .addFields(
            { name: `${config.prefix}play [Name or Link]`, value: 'This command is used to request songs.', inline: false },
            { name: `${config.prefix}skip`, value: 'We will skip songs with this command.', inline: false },
            { name: `${config.prefix}stop`, value: 'If you want to stop the music.', inline: false },
            { name: `${config.prefix}list`, value: 'Music List', inline: false },
            { name: `${config.prefix}loop`, value: 'If you want to loop the music.', inline: false },
        )
        .setTimestamp()
        .setFooter(client.user.username,client.user.avatarURL());
    return dcEmbed;
}

// music list embed
function ListEmbed(barColor, title, des, img, inVoiceCN, loop) {
    if (inVoiceCN === true) {
        var check = 'N/A'
        if (loop === true) {
            check = 'Enabled'
        } else {
            check = 'Disabled'
        }
        const { MessageEmbed } = require('discord.js');
        const dcEmbed = new MessageEmbed()
            .setColor(barColor)
            .setTitle(title)
            .setDescription(des)
            .setThumbnail(img)
            .addFields(
                { name: 'Loop', value: check, inline: false }
            )
            .setTimestamp()
            .setFooter(client.user.username,client.user.avatarURL());
        return dcEmbed;
    } else {
        const { MessageEmbed } = require('discord.js');
        const dcEmbed = new MessageEmbed()
            .setColor(barColor)
            .setTitle(title)
            .setDescription(des)
            .setThumbnail(img)
            .setTimestamp()
            .setFooter(client.user.username,client.user.avatarURL());
        return dcEmbed;
    }
}

// music function
const queue = new Map();

var queueContruct
var loop = false

async function execute(msg, serverQueue) {

    const args = msg.content.split(" ");
    var songInfo
    var song = {}

    if (msg.content.includes('https://') !== true) {
        yt.search(msg.content.substring(5), 1, function (error, result) {
            if (error) {
                msg.channel.send(embed('#FF6767', 'Music | Error 📻', "I didn't find the song you requested \nplease check the correctness!", 'https://media3.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif', true))
                console.log(error);
            }
            else {
                var linkURL = 'https://www.youtube.com/watch?v=' + result.items[0].id.videoId
                var titleName = result.items[0].snippet.title
                song = {
                    title: titleName,
                    url: linkURL,
                    image: result.items[0].snippet.thumbnails.high.url,
                };
                setQueue(result.items[0].snippet.thumbnails.high.url)
            }
        });
    } else if (msg.content.includes('https://') && msg.content.includes('&list')) {
        try {
            var mixPlayListURL = msg.content.slice('https://www.youtube.com/watch?v='.length + 6)
            var mixPlaylist = await ytmpl(mixPlayListURL);

            songInfo = await ytdl.getInfo(args[1]);
            song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                image: songInfo.videoDetails.thumbnails[4].url,
            };
            setQueue('playlist')
                .then(() => {
                    mixPlaylist.items.forEach(i => {
                        getListOfSong(i.url)
                    })
                    async function getListOfSong(urlList) {
                        songInfo = await ytdl.getInfo(urlList);
                        if (songInfo.videoDetails === undefined) return
                        song = {
                            title: songInfo.videoDetails.title,
                            url: songInfo.videoDetails.video_url,
                            image: '',
                        };
                        setQueue('playlistAdded')
                    }
                    msg.channel.send(embed('#CF90E5', 'Music | Playlist 📻', `${mixPlaylist.title} has been added to the queue!`, song.image, true));
                })
        } catch (error) {
            msg.channel.send(embed('#FF6767', 'Music | Error 📻', "I didn't find the song you requested \nplease check the correctness!", 'https://media3.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif', true))
        }

    } else {
        try {
            songInfo = await ytdl.getInfo(args[1]);
            song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                image: songInfo.videoDetails.thumbnails[4].url,
            };
            setQueue()
        } catch (error) {
            msg.channel.send(embed('#FF6767', 'Music | Error 📻', "I didn't find the song you requested \nplease check the correctness!", 'https://media3.giphy.com/media/TqiwHbFBaZ4ti/giphy.gif', true))
        }

    }
    var serverQueue
    async function setQueue(typeCheck) {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel)
            return msg.channel.send(embed('#CF90E5', 'Music 📻', `You must be in a voice channel!`, 'https://c.tenor.com/iNu8LXx2ECgAAAAC/senko-poute-hmph.gif', true));
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return msg.channel.send(embed('#CF90E5', 'Music 📻', `Sorry, I don't have permission`, 'https://c.tenor.com/Q0HUwg81A_0AAAAC/anime-cry.gif', true));
        }
        // here get editing
        if (serverQueue === undefined) {
            queueContruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueContruct);
            queueContruct.songs.push(song);
            serverQueue = queue.get(msg.guild.id);

            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                if (typeCheck !== 'playlistAdded') {
                    play(msg.guild, queueContruct.songs[0]);
                }
            } catch (err) {
                queue.delete(msg.guild.id);
                console.log(err)
                return msg.channel.send(err);
            }
        } else {
            if (song.image === undefined) return
            if (typeCheck !== 'playlist' && typeCheck !== 'playlistAdded') {
                serverQueue.songs.push(song);
                return msg.channel.send(embed('#CF90E5', 'Music | Add 📻', `${song.title} has been added to the queue!`, song.image, true));
            }
            if (serverQueue) {
                serverQueue.songs.push(song);
            }
        }
    }

}


var skipCommand = false
function skip(msg, serverQueue) {
    if (!msg.member.voice.channel)
        return msg.channel.send(embed('#FF2727', 'Music | Skip 📻', `You're skipping the song, but you're not listening!!`, 'https://c.tenor.com/X3x3Y2mp2W8AAAAM/anime-angry.gif', true));
    if (!serverQueue)
        return msg.channel.send(embed('#CF90E5', 'Music | Skip 📻', `Hmm.. seems like there's no song to skip!?`, 'https://cdn35.picsart.com/141906934001202.gif?to=min&r=640', true));
    if (loop === false) {
        serverQueue.connection.dispatcher.end();
    } else {
        skipCommand = true;
        serverQueue.connection.dispatcher.end();
    }
}
function stop(msg, serverQueue) {
    stopByUser = true;
    if (!msg.member.voice.channel)
        return msg.channel.send(embed('#FF2727', 'Music |  Disconnect 📻', `Ha!! You're turning off the music, but you're not listening!`, 'https://c.tenor.com/X3x3Y2mp2W8AAAAM/anime-angry.gif', true));

    if (!serverQueue)
        return msg.channel.send(embed('#FF2727', 'Music |  Disconnect 📻', `Hmm.. seems like there's no song to turn off!?`, 'https://cdn35.picsart.com/141906934001202.gif?to=min&r=640', true));

    if (loop === false) {
        try {
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
        } catch (error) {
            return msg.channel.send(embed('#FF7388', 'Music |  Disconnect 📻', 'Thank you for using the service.', 'https://gifimage.net/wp-content/uploads/2017/11/gif-kawaii-anime-10.gif', true));
        }

    } else {
        skipCommand = true;
        try {
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
        } catch (error) {
            return msg.channel.send(embed('#FF7388', 'Music |  Disconnect 📻', 'Thank you for using the service.', 'https://gifimage.net/wp-content/uploads/2017/11/gif-kawaii-anime-10.gif', true));
        }

    }
    return msg.channel.send(embed('#FF7388', 'Music |  Disconnect 📻', 'Thank you for using the service.', 'https://gifimage.net/wp-content/uploads/2017/11/gif-kawaii-anime-10.gif', true));
}



function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        setTimeout(() => {
            if (queue.get(guild.id)) return
            serverQueue.voiceChannel.leave();
            if (stopByUser === false) {
                serverQueue.textChannel.send(embed('#FF2C2C', 'Music | Disconnect 📻', "I already sang all the songs you requested. Let's me rest for a while", 'https://c.tenor.com/Ftfa-ehSIs4AAAAM/miyako-hoshino-wataten.gif', true))
            }
            loop = false;
        }, 60 * 1000);

        queue.delete(guild.id);
        serverQueue.textChannel.send(embed('#FF2C2C', 'Music | Skip 📻', "There's no next song, right? \nIf you don't ask for the song, I'll be gone.", 'https://i.pinimg.com/originals/d5/a2/b0/d5a2b01b8294bfb8678d67342b106795.gif', true))
        return;
    }
    serverQueue.textChannel.send(embed('#CF90E5', 'Music | Play 📻', `i will sing: **${song.title}** for you, hehe.`, 'https://thumbs.gfycat.com/UnsungRespectfulBergerpicard-max-1mb.gif', true));

    function loopPlay() {
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on("finish", () => {
                if (loop === true && skipCommand === false) {
                    loopPlay()
                    return
                } else {
                    if (serverQueue.songs[0]) {
                        serverQueue.songs.shift();
                        play(guild, serverQueue.songs[0]);
                    } else {
                        serverQueue.voiceChannel.leave();
                        queue.delete(guild.id);
                        loop = false;
                        if (stopByUser === false) {
                            serverQueue.textChannel.send(embed('#FF2C2C', 'Music | Disconnect', "I already sang all the songs you requested. Let's me rest for a while", 'https://c.tenor.com/Ftfa-ehSIs4AAAAM/miyako-hoshino-wataten.gif', true))
                        }
                    }
                    skipCommand = false
                }
            })
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }
    loopPlay()

}
function list(msg, serverQueue) {
    if (!serverQueue) {
        msg.channel.send(ListEmbed('#FF7388', 'Music 📻', 'There are currently no songs in the queue.', 'https://cdna.artstation.com/p/assets/images/images/038/072/082/original/perrine-huguenot-radio.gif?1622088740&dl=1', false, loop));
    } else {
        var queue = ''
        var num = 0
        queueContruct.songs.forEach(() => {
            num = num + 1
            queue = queue + num + ' | ' + queueContruct.songs[num - 1].title + '\n'
        })
        msg.channel.send(ListEmbed('#FF7388', 'Music | SongList📻', queue, 'https://cdna.artstation.com/p/assets/images/images/038/072/082/original/perrine-huguenot-radio.gif?1622088740&dl=1', true, loop))
    }
}
function loopSong(msg, serverQueue) {
    if (!msg.member.voice.channel) {
        msg.channel.send(embed('#CF90E5', 'Music | Skip 📻', `Haha! You will loop the music Even though I myself didn't listen!?`, 'https://c.tenor.com/X3x3Y2mp2W8AAAAM/anime-angry.gif', true));
    } else if (!serverQueue) {
        msg.channel.send(embed('#FF7388', 'Music | Loop', 'Hmm.. seems like there is no song to loop.', 'https://cdna.artstation.com/p/assets/images/images/038/072/082/original/perrine-huguenot-radio.gif?1622088740&dl=1', true))
    } else {
        if (loop === false) {
            loop = true;
            msg.channel.send(embed('#71FF73', 'Music | Loop', "I'll sing a loop for you!", 'https://thumbs.gfycat.com/UnsungRespectfulBergerpicard-max-1mb.gif', true))
        } else {
            loop = false;
            msg.channel.send(embed('#FF2C2C', 'Music | Loop', "I'm tired of dying!", 'https://c.tenor.com/Ftfa-ehSIs4AAAAM/miyako-hoshino-wataten.gif', true))
        }
    }
}
// Sorry for not making gif config, I'm lazy. hehe..
client.login(config.token);

