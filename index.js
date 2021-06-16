require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js');

const client = new Client();
const prefix = process.env.PREFIX;

const watchedUser = {
    isDeafened: false,
    userID: '',
    defaultUser: 'Hooksh0t#6123',
    voiceChannel: ''
}

const guildData = {
    guildID: '',
    guildName: '',
}


const userHandler = (arg) => {
    if(!arg) return;

    if(arg.startsWith('<@') && arg.endsWith('>')) {
        arg = arg.slice(2,-1);
        if(arg.startsWith('!')){
            arg = arg.slice(1);
        }
        watchedUser.userID = arg;
        let targetUser = client.users.cache.get(arg);
        return(targetUser);
        
    }

    else{
        let targetUser = client.users.cache.find(user => user.tag === arg);
        watchedUser.userID = targetUser.id;
        return (targetUser); 
    }
}


client.once('ready', async () => {
    console.log('\nLuke Patrol is online in servers: ');
    try{

        guildData.guildID = client.guilds.cache.map( guild => guild.id);
        guildData.guildName = await client.guilds.fetch(guildData.guildID).name;

        let defaultUser = client.users.cache.find(user => user.tag === "Hooksh0t#6123");
        let userID = defaultUser.id;


        console.log("ID:",guildData.guildID,"  |  NAME:",guildData.guildName);
        console.log("\nDefault user:", defaultUser.username + "#" + defaultUser.discriminator, "ID:", userID);
    }

    catch(error){
        console.log(error, "Luke not in this guild");
    }
});

client.on('message', async message => {

    if( message.member.user.tag !== "Prototype#2334" && !message.content.startsWith(prefix)) return;
    let args = message.content.slice(prefix.length).trim().split(' ');
    let command = args.shift().toLowerCase();
    let user = userHandler(args[0]);
    console.log(command, args.toString());

    if(command === "help") {
        let helpEmbed = new MessageEmbed()
            .setColor('#ff9763')
            .setTitle('Commands for Luke Patrol')
            .addFields(
                { name: '!watch', value: "!watch user#2467 or !watch @user while in channel with target for bot to join and monitor them." },
                { name: '!ready', value: "!ready while in a voice channel with luke for the bot to join and watch him." },
                { name: '!stop', value: "!stop to clear watched user and set bot back to idle" },
            )

        message.channel.send(helpEmbed);
    }

    if( command === "watch" ) {  
        let taggedUser = message.guild.members.cache.get(user.id);
        let taggedName = taggedUser.nickname ? taggedUser.nickname : taggedUser.user.username;
        let taggedChannel = taggedUser.voice.channel;
        let authorChannel = message.member.voice.channel;
        watchedUser.voiceChannel = taggedChannel;

        console.log("Author Channel: " + authorChannel, "Tagged Channel: " + taggedChannel);
        watchedUser.isDeafened = taggedUser.voice.selfDeaf;
        message.channel.send("Acquiring target: " + `**${taggedName}**`);

        client.user.setStatus('dnd');

        if(authorChannel === taggedChannel && authorChannel && taggedChannel){
            try{
                await authorChannel.join();
            }
            catch (error){
                console.log(error);
            }
        }

        else if(!authorChannel){
            message.reply(`Join a voice channel with ${taggedName}`);
        }

        else if(!taggedChannel){
            message.reply(`${taggedName} is not in the voice channel`);
        }
    }


    if( command === "ready" && message.member.voice.channel) {    
        client.user.setStatus('dnd');
        try{
            await message.member.voice.channel.join();
        }
        catch (error){
            console.log(error);
        }
    } 

    else if( command === "stop" ){
        try{
            client.user.setStatus('online');
            watchedUser.voiceChannel.leave();
            watchedUser.userID = '';
        }
        catch (error){
            console.log(error)
        }
    }

    else {
        client.user.setPresence({ activity: null }); 
    }
    
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    let newChannelID = newMember.channelID;
    let oldChannelID = oldMember.channelID;
    let newVoiceChannel = newMember.member.voice.channel;

    if( newMember.id === watchedUser.userID ){
        watchedUser.isDeafened = newMember.selfDeaf;
        if(watchedUser.isDeafened){   
            newMember.setChannel(null);  
            console.log("disconnected")
        }
    }
    
    if (newChannelID !== oldChannelID) {
        if(newChannelID){
            console.log(`${newMember.member.user.username} joined ` + newVoiceChannel.name + " with deafened:", newMember.selfDeaf);
        }
        else if(oldChannelID){
            console.log(`${oldMember.member.user.username} left ` + oldMember.channel.name + " with deafened:", oldMember.selfDeaf);
        }
        else{
            console.log("User joined");
        }
    }  

});

client.login(process.env.BOT_TOKEN);