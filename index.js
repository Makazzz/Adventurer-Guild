var Discord = require("discord.js");
var client = new Discord.Client();

var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 8080));
app.get('/', function(request, response) {
    var result = 'App is running';
    response.send(result);
})
app.get('/adventurer', function(request, response) {
    var result = createSaveText();
    response.send("<pre>"+result+"</pre>");
})
app.get('/quest', function(request, response) {
    var result = createQuestText();
    response.send("<pre>"+result+"</pre>");
})
app.get('/channel', function(request, response) {
    var result = createChannelText();
    response.send("<pre>"+result+"</pre>");
})

app.listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

var Adventurer=require("./adventurer.js");
var adventurer={};

var fightCooldown={};

var questAll={};
var quest={};
var questAllDone={};
var questDone={};

var botChannel={};

var fs=require("fs");

if(fs.existsSync("./adventurer.txt")){
	//load
	var adventurerReader = require('readline').createInterface({
		input: fs.createReadStream('./adventurer.txt')
	});
	adventurerReader.on('line', function (line) {
		var obj=line.split(",");
		if(adventurer[obj[0]]==undefined)adventurer[obj[0]]={};
		adventurer[obj[0]][obj[1]]=new Adventurer();
		adventurer[obj[0]][obj[1]].set(
			parseInt(obj[2]),parseInt(obj[3]),parseInt(obj[4]),parseInt(obj[5]),parseInt(obj[6]),parseInt(obj[7]),parseInt(obj[8]),parseInt(obj[9]),//basic
			parseInt(obj[10]),parseInt(obj[11]),//reincarnate+pantsu
			parseInt(obj[12])//eris
			);
	});
	console.log("Data loaded!");
}
else console.log("Save data not found!");

if(fs.existsSync("./quest.txt")){
	//load
	var questReader = require('readline').createInterface({
		input: fs.createReadStream('./quest.txt')
	});
	questReader.on('line', function (line) {
		var obj=line.split("|");
		if(obj[0]=="questAll"){
			questAll[obj[1]]=[obj[2],parseInt(obj[3]),obj[4].replace(/!p/g,"|").replace(/!e/g,"!")];
		}
		else if(obj[0]=="questAllDone"){
			if(questAllDone[obj[1]]==undefined)questAllDone[obj[1]]={};
			questAllDone[obj[1]][obj[2]]=parseInt(obj[3]);
		}
		else if(obj[0]=="quest"){
			if(quest[obj[1]]==undefined)quest[obj[1]]={};
			//back compability
			if(obj[6]==undefined)obj[6]='0';
			quest[obj[1]][obj[2]]=[obj[3],parseInt(obj[4]),obj[5].replace(/!p/g,"|").replace(/!e/g,"!"),parseInt(obj[6])];
		}
		else if(obj[0]=="questDone"){
			if(questDone[obj[1]]==undefined)questDone[obj[1]]={};
			questDone[obj[1]][obj[2]]=parseInt(obj[3]);
		}
	});
	console.log("Quest loaded!");
}
else console.log("Quest data not found!");

var channelLoaded=false;

function checkChannel(guild){
	if(client.channels.has(botChannel[guild].id))
		return true;
	else{
		delete botChannel[guild];
		saveChannel();
		return false;
	}
}

function loadChannel(){
	if(channelLoaded)return;
	if(fs.existsSync("./channel.txt")){
		//load
		var channelReader = require('readline').createInterface({
			input: fs.createReadStream('./channel.txt')
		});
		channelReader.on('line', function (line) {
			var obj=line.split(",");
			botChannel[obj[0]]=client.channels.get(obj[1]);
			//start event
			eventStatus[obj[0]]=0;
			var eventTime=Math.ceil(Math.random()*35400000)+600000; //10 mins~10 hrs
			console.log("event "+timeString(eventTime));
			setTimeout(function(){openEvent(obj[0]);},eventTime);
		});
		console.log("Channel loaded!");
	}
	else console.log("Channel data not found!");
	channelLoaded=true;
}

function createSaveText(){
	var savetext="";
	for(guild in adventurer){
		for(user in adventurer[guild]){
			savetext+=guild+","+user+","+
			adventurer[guild][user].level+","+
			adventurer[guild][user].experience+","+
			adventurer[guild][user].strength+","+
			adventurer[guild][user].health+","+
			adventurer[guild][user].magicpower+","+
			adventurer[guild][user].dexterity+","+
			adventurer[guild][user].agility+","+
			adventurer[guild][user].luck+","+
			adventurer[guild][user].reincarnate+","+
			adventurer[guild][user].pantsu+","+
			adventurer[guild][user].eris+"\n";
		}
	}
	return savetext;
}

function saveData(){
	var savetext=createSaveText();
	fs.writeFile('./adventurer.txt', savetext,  function(err) {
		if (err) return console.error(err);
		console.log("Data saved!");
	});
}

function createQuestText(){
	var savetext="";
	for(x in questAll){
		if(questAll[x]==undefined)continue;
		savetext+="questAll|"+x+"|"+questAll[x][0]+"|"+questAll[x][1]+"|"+questAll[x][2].replace(/!/g,"!e").replace(/\|/g,"!p")+"\n";
		for(y in questAllDone[x]){
			savetext+="questAllDone|"+x+"|"+y+"|"+questAllDone[x][y]+"\n";
		}
	}
	for(x in quest){
		for(y in quest[x]){
			if(quest[x][y]==undefined)continue;
			//back compability
			if(quest[x][y][3]==undefined)quest[x][y][3]=0;
			savetext+="quest|"+x+"|"+y+"|"+quest[x][y][0]+"|"+quest[x][y][1]+"|"+quest[x][y][2].replace(/!/g,"!e").replace(/\|/g,"!p")+"|"+quest[x][y][3]+"\n";
			if(questDone[x][y]==undefined)continue;
			savetext+="questDone|"+x+"|"+y+"|"+questDone[x][y]+"\n";
		}
	}
	return savetext;
}

function saveQuest(){
	var savetext=createQuestText();
	fs.writeFile('./quest.txt', savetext,  function(err) {
		if (err) return console.error(err);
		console.log("Quest saved!");
	});
}

function createChannelText(){
	var savetext="";
	for(guild in botChannel){
		savetext+=guild+","+botChannel[guild].id+"\n";
	}
	return savetext;
}

function saveChannel(){
	var savetext=createChannelText();
	fs.writeFile('./channel.txt', savetext,  function(err) {
		if (err) return console.error(err);
		console.log("Channel saved!");
	});
}

function timeString(millis){
	var seconds=Math.ceil(millis/1000);
	var minutes=0;
	if(seconds>=60){minutes=Math.floor(seconds/60); seconds%=60;}
	var hours=0;
	if(minutes>=60){hours=Math.floor(minutes/60); minutes%=60;}
	var text="";
	if(hours>0)text+=hours+" hours";
	if(text!="")text+=" ";
	if(minutes>0)text+=minutes+" minutes";
	if(text!="")text+=" ";
	if(seconds>0)text+=seconds+" seconds";
	return text;
}

var bully=0;
var word="fuck you";
//Old owner
//var owner="206099144346042369";
//Puni#2963 Created: 2016-07-22 17:24:25
var owner="168187804277276672";

client.on("message", msg => {
	if(msg.author.id==client.user.id)return;
	var content=msg.content.toLowerCase();
	
	//bully people
	if(bully!=0){
		if(msg.author.id==bully){
			msg.channel.send(word);
		}
	}
	//admin target bully
	if(msg.author.id==owner && content.startsWith(".bully <@")){
		bully=msg.mentions.users.firstKey();
		msg.channel.send("O7");
		return;
	}
	else if(msg.author.id==owner && content.startsWith(".bully ")){
		bully=content.substr(7);
		msg.channel.send("O7");
		return;
	}
	//stop bully
	if(msg.author.id==owner && content.startsWith(".stop")){
		bully=0;
		msg.channel.send("O7");
		return;
	}
	//set bully word
	if(msg.author.id==owner && content.startsWith(".word ")){
		word=msg.content.substr(6);
		msg.channel.send("O7");
		return;
	}
	//repeat message
	if(msg.author.id==owner && content.startsWith(".say ")){
		msg.channel.send(msg.content.substr(5));
		return;
	}
	//set nickname
	if(msg.author.id==owner && content.startsWith(".nick ")){
		msg.guild.members.get(client.user.id).setNickname(msg.content.substr(6));
		msg.channel.send("O7");
		return;
	}
	
	//new server
	if(adventurer[msg.guild.id]==undefined)adventurer[msg.guild.id]={};
	if(fightCooldown[msg.guild.id]==undefined)fightCooldown[msg.guild.id]={};
	if(quest[msg.guild.id]==undefined)quest[msg.guild.id]={};
	if(questAllDone[msg.guild.id]==undefined)questAllDone[msg.guild.id]={};
	if(questDone[msg.guild.id]==undefined)questDone[msg.guild.id]={};
	
	//mention bot
	if(content.startsWith("<@"+client.user.id+">") || content.startsWith("<@!"+client.user.id+">")){
		var cmd=content.substr(content.indexOf(">")+2);
		//set channel
		if(cmd.startsWith("here")){
			botChannel[msg.guild.id]=msg.channel;
			if(eventStatus[msg.guild.id]==undefined){
				eventStatus[msg.guild.id]=0;
				var eventTime=Math.ceil(Math.random()*35400000)+600000; //10 mins~10 hrs
				setTimeout(function(){openEvent(msg.guild.id);},eventTime);
			}
			msg.channel.send("Roger");
			saveChannel();
			return;
		}
		//owner command
		if(msg.author.id==owner){
			//play games
			if(cmd.startsWith("play ")){
				game=msg.content.substr(("<@"+client.user.id+"> play ").length);
				if(game.length>0){
					console.log("playing "+game);
					client.user.setActivity(game);
					return;
				}
			}
		}
		//help
		msg.channel.send("```Commands:\n\n"+
		"new adventurer   register as adventurer\n"+
		"adventurer stat  check your stats\n"+
		"fight            fight someone\n"+
		"reincarnate me   RESET to Lv 1 with bonus stat!\n"+
		"                 DO AT YOUR OWN RISK\n"+
		"leaderboard      show top 10 level adventurers\n"+
		"hall of fame     show special adventurers\n"+
		"issue quest      issue a quest for all\n"+
		"quest start      start a quest for yourself\n"+
		"quest list       show quest available\n"+
		//"transfer eris    transfer eris to others\n"+
		//"transfer pantsu  transfer pantsu to others\n"+
		"```");
	}
	
	//new adventurer
	else if(content.startsWith("new adventurer")) {
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			console.log("new adventurer");
			adventurer[msg.guild.id][msg.author.id]=new Adventurer();
			msg.channel.send(msg.author+" is now an adventurer!");
			//save
			saveData();
		}
		else msg.channel.send(msg.author+" is already an adventurer!");
    }
	
	//adventurer stat
	else if(content.startsWith("adventurer stat")) {
		console.log("adventurer stat");
		//stats of preset character
		if(content.startsWith("adventurer stat kazuma")) msg.channel.send(Adventurer.Kazuma.stats("Kazuma"));
		else if(content.startsWith("adventurer stat aqua")) msg.channel.send(Adventurer.Aqua.stats("Aqua"));
		else if(content.startsWith("adventurer stat megumin")) msg.channel.send(Adventurer.Megumin.stats("Megumin"));
		//is mentioned
		else if(msg.mentions.users.array().length>0) {
			var mentionID=msg.mentions.users.firstKey();
			var mentionUser=client.users.get(mentionID);
			//check mentioned is not this bot
			if(mentionID==client.user.id) msg.channel.send(msg.author+" if you fight me, you'll understand...");
			//check mentioned is not adventurer
			else if(adventurer[msg.guild.id][mentionID]!=undefined) msg.channel.send(adventurer[msg.guild.id][mentionID].stats(mentionUser.username));
			else msg.channel.send(mentionUser+" is not an adventurer!");
		}
		//self (check is adventurer)
		else if(adventurer[msg.guild.id][msg.author.id]!=undefined) msg.channel.send(adventurer[msg.guild.id][msg.author.id].stats(msg.author.username));
		else msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
	}
	
	//fight
	else if(content.startsWith("fight")) {
		//check adventurer
		if(adventurer[msg.guild.id][msg.author.id]!=undefined){
			//check cooldown
			if(fightCooldown[msg.guild.id][msg.author.id]==undefined)fightCooldown[msg.guild.id][msg.author.id]=[0,0];
			var timeLeft=(fightCooldown[msg.guild.id][msg.author.id][1]*1000)-(new Date().getTime()-fightCooldown[msg.guild.id][msg.author.id][0]);
			if(timeLeft>0){
				msg.channel.send(msg.author+" you are too tired, rest "+timeString(timeLeft)+" more!");
				return;
			}
			console.log("fight");
			var prelevel=adventurer[msg.guild.id][msg.author.id].level;
			//if event
			if(content.startsWith("fight event") && eventStatus[msg.guild.id]==2){
				if(participator[msg.guild.id][msg.author.id]==undefined){
					participator[msg.guild.id][msg.author.id]=new LiveAdv(adventurer[msg.guild.id][msg.author.id]);
				}
				//check dead
				if(participator[msg.guild.id][msg.author.id].hp<=0){
					msg.channel.send(msg.author+" you are dead!");
					return;
				}
				var result=participator[msg.guild.id][msg.author.id].combat(msg.author.username,event[msg.guild.id][5],adventurer[msg.guild.id][msg.author.id],adversaries[msg.guild.id][0],adversaries[msg.guild.id][1]);
				msg.channel.send("```"+result+"\n\n"+event[msg.guild.id][5]+" ("+adversaries[msg.guild.id][1].hpInfo(adversaries[msg.guild.id][0])+")```");
				//if win
				if(adversaries[msg.guild.id][1].hp<=0){
					adversaries[msg.guild.id][2]--;
					//cabbage
					if(event[msg.guild.id][0]==2){
						adventurer[msg.guild.id][msg.author.id].eris+=10000;
						adventurer[msg.guild.id][msg.author.id].getExp(100);
						adversaries[msg.guild.id][1]=new LiveAdv(adversaries[msg.guild.id][0]);
						msg.channel.send("*throws 10,000 eris at* "+msg.author);
					}
					//cicada
					if(event[msg.guild.id][0]==3){
						adventurer[msg.guild.id][msg.author.id].getExp(adversaries[msg.guild.id][0].level);
						adversaries[msg.guild.id][0]=adversaries[msg.guild.id][0].addStat(getCicada());
						adversaries[msg.guild.id][1]=new LiveAdv(adversaries[msg.guild.id][0]);
					}
					if(adversaries[msg.guild.id][2]<=0){
						clearTimeout(closingEvent[msg.guild.id]);
						closeEvent(msg.guild.id,true);
					}
					else msg.channel.send(adversaries[msg.guild.id][2]+" "+event[msg.guild.id][5]+" left...");
				}
				fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
				//check lv up
				if(adventurer[msg.guild.id][msg.author.id].level>prelevel) msg.channel.send(msg.author+" leveled up!");
				//save
				saveData();
				return;
			}
			//if preset enemy
			if(content.startsWith("fight kazuma")) {
				var battleLog=adventurer[msg.guild.id][msg.author.id].fight(msg.author.username,"Kazuma",Adventurer.Kazuma);
				msg.channel.send("```"+battleLog+"```");
				fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
			}
			else if(content.startsWith("fight aqua")) {
				var battleLog=adventurer[msg.guild.id][msg.author.id].fight(msg.author.username,"Aqua",Adventurer.Aqua);
				msg.channel.send("```"+battleLog+"```");
				fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
			}
			else if(content.startsWith("fight megumin")) {
				var battleLog=adventurer[msg.guild.id][msg.author.id].fight(msg.author.username,"Megumin",Adventurer.Megumin);
				msg.channel.send("```"+battleLog+"```");
				fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
			}
			else {
				//check no mention
				if(msg.mentions.users.array().length==0){
					//usage help
					msg.channel.send("```Usage:\nfight <mention>\n\npreset enemy available: Kazuma, Aqua, Megumin\n\nExample:\nfight Kazuma\n\nInfo:\nfight someone```");
					return;
				}
				var enemyID=msg.mentions.users.firstKey();
				//check enemy is not self
				if(msg.author.id==enemyID){
					msg.channel.send(msg.author+" don't do this to yourself!");
					return;
				}
				//check enemy is this bot
				if(enemyID==client.user.id){
					msg.channel.send(msg.author+" you tought you could challenge me? Now feel my wrath!");
					var shadow=adventurer[msg.guild.id][msg.author.id].getShadow(3);
					var battleLog=adventurer[msg.guild.id][msg.author.id].fight(msg.author.username,client.user.username,shadow);
					msg.channel.send("```"+battleLog+"```");
					fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
					if(!battleLog.endsWith(client.user.username+" wins!\n")){
						//eris reward
						var reward=Math.ceil(Math.random()*adventurer[msg.guild.id][msg.author.id].level);
						adventurer[msg.guild.id][msg.author.id].eris+=reward;
						msg.channel.send(msg.author+" you shall remember this!\nYou stole "+reward+" eris from the guild!");
					}
					return;
				}
				var enemyUser=client.users.get(enemyID);
				//check enemy is adventurer
				if(adventurer[msg.guild.id][enemyID]!=undefined){
					var prelevel2=adventurer[msg.guild.id][enemyID].level;
					var battleLog=adventurer[msg.guild.id][msg.author.id].fight(msg.author.username,enemyUser.username,adventurer[msg.guild.id][enemyID]);
					msg.channel.send("```"+battleLog+"```");
					fightCooldown[msg.guild.id][msg.author.id]=[new Date().getTime(),Math.ceil(Math.random()*5+10)];
					if(adventurer[msg.guild.id][enemyID].level>prelevel2) msg.channel.send(enemyUser+" leveled up!");
					//check quests if win
					if(battleLog.endsWith(msg.author.username+" wins!\n")){
						if(questAll[msg.guild.id]!=undefined){
							if(enemyID==questAll[msg.guild.id][0]){
								if(questAllDone[msg.guild.id][msg.author.id]==undefined)questAllDone[msg.guild.id][msg.author.id]=0;
								questAllDone[msg.guild.id][msg.author.id]++;
								//check quest complete
								if(questAllDone[msg.guild.id][msg.author.id]>=questAll[msg.guild.id][1]){
									//reward & reset quest (quest all reward x3)
									var reward=Math.ceil(Math.random()*adventurer[msg.guild.id][questAll[msg.guild.id][0]].level*questAll[msg.guild.id][1]*3);
									adventurer[msg.guild.id][msg.author.id].eris+=reward;
									questAll[msg.guild.id]=undefined;
									msg.channel.send(msg.author+"You have completed the shared quest!\n*throws "+reward+" eris at you*");
								}
							}
						}
						if(quest[msg.guild.id][msg.author.id]!=undefined){
							if(enemyID==quest[msg.guild.id][msg.author.id][0]){
								questDone[msg.guild.id][msg.author.id]++;
								//check quest complete
								if(questDone[msg.guild.id][msg.author.id]>=quest[msg.guild.id][msg.author.id][1]){
									//reward & reset quest
									var reward=Math.ceil(Math.random()*adventurer[msg.guild.id][quest[msg.guild.id][msg.author.id][0]].level*quest[msg.guild.id][msg.author.id][1]);
									adventurer[msg.guild.id][msg.author.id].eris+=reward;
									quest[msg.guild.id][msg.author.id]=undefined;
									msg.channel.send(msg.author+"You have completed the personal quest!\n*throws "+reward+" eris at you*");
								}
							}
						}
						//save
						saveQuest();
					}
				}
				else msg.channel.send(enemyUser+" is not an adventurer!");
			}
			if(adventurer[msg.guild.id][msg.author.id].level>prelevel) msg.channel.send(msg.author+" leveled up!");
			//save
			saveData();
		}
		else msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
	}
	
	//reincarnate
	else if(content=="reincarnate me"){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]!=undefined){
			console.log("reincarnate");
			adventurer[msg.guild.id][msg.author.id].reincarnation();
			msg.channel.send(msg.author+" have reincarnated");
			//save
			saveData();
		}
		else msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
	}
	
	//leaderboard
	else if(content=="leaderboard"){
		console.log("leaderboard");
		var server=JSON.parse(JSON.stringify(adventurer[msg.guild.id]));
		var top;
		var text="";
		for(i=0; i<10; i++){
			//count objects
			var length=0;
			for(x in server)length++;
			if(length<=0)break;
			for(x in server){
				if(top==undefined)top=x;
				else if(server[x].level>server[top].level)top=x;
			}
			text+=(i+1)+". "+client.users.get(top).username+" Lv "+server[top].level+"\n";
			delete server[top];
			top=undefined;
		}
		if(text=="")msg.channel.send("There is no adventurer :frowning:");
		else msg.channel.send("```"+text+"```");
	}
	
	//hall of fame
	else if(content=="hall of fame"){
		var server=adventurer[msg.guild.id];
		var top;
		var text="";
		//no adventurer
		var length=0;
		for(x in server)length++;
		if(length<=0){
			msg.channel.send("There is no adventurer :frowning:");
			return;
		}
		console.log("hall of fame");
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].level>server[top].level)top=x;
		}
		text+="Highest Lv  : "+client.users.get(top).username+" ("+server[top].level+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].strength>server[top].strength)top=x;
		}
		text+="Highest STR : "+client.users.get(top).username+" ("+server[top].strength+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].health>server[top].health)top=x;
		}
		text+="Highest HP  : "+client.users.get(top).username+" ("+server[top].health+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].magicpower>server[top].magicpower)top=x;
		}
		text+="Highest MAG : "+client.users.get(top).username+" ("+server[top].magicpower+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].dexterity>server[top].dexterity)top=x;
		}
		text+="Highest DEX : "+client.users.get(top).username+" ("+server[top].dexterity+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].agility>server[top].agility)top=x;
		}
		text+="Highest AGI : "+client.users.get(top).username+" ("+server[top].agility+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].luck>server[top].luck)top=x;
		}
		text+="Highest LUCK: "+client.users.get(top).username+" ("+server[top].luck+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].eris>server[top].eris)top=x;
		}
		text+="Most eris   : "+client.users.get(top).username+" ("+server[top].eris+")\n";
		for(x in server){
			if(top==undefined)top=x;
			else if(server[x].pantsu>server[top].pantsu)top=x;
		}
		text+="Most Pantsu : "+client.users.get(top).username+" ("+server[top].pantsu+")\n";
		msg.channel.send("```"+text+"```");
	}
	
	//issue (shared) quest
	else if(content=="issue quest"){
		//already issued
		if(questAll[msg.guild.id]!=undefined){
			msg.channel.send("Quest already issued! Check it by `quest list` command!");
			return;
		}
		//copy adventurer ID
		var arrayID=[];
		var length=0;
		for(x in adventurer[msg.guild.id]){
			arrayID[length]=x;
			length++;
		}
		//not enough adventurer
		if(length<1){
			msg.channel.send("Not enough adventurer! At least 1 is needed");
			return;
		}
		console.log("issue quest")
		//target id, kill needed, flavor
		questAll[msg.guild.id]=[arrayID[Math.floor(Math.random()*arrayID.length)],Math.ceil(Math.random()*3+1)*5,questFlavor[Math.floor(Math.random()*questFlavor.length)]];
		questAllDone[msg.guild.id]={};
		msg.channel.send("Quest issued!\nKill "+questAll[msg.guild.id][1]+" "+client.users.get(questAll[msg.guild.id][0]).username+"!\n"+questAll[msg.guild.id][2]);
		//save
		saveQuest();
	}
	
	//start (personal) quest
	else if(content=="quest start"){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		//copy adventurer ID
		var arrayID=[];
		var length=0;
		for(x in adventurer[msg.guild.id]){
			arrayID[length]=x;
			length++;
		}
		//not enough adventurer
		if(length<2){
			msg.channel.send("Not enough adventurer! At least 2 is needed");
			return;
		}
		//check cooldown
		if(quest[msg.guild.id][msg.author.id]!=undefined){
			//cooldown = 1hr
			var timePassed=new Date().getTime()-quest[msg.guild.id][msg.author.id][3];
			if(timePassed<3600000){
				msg.channel.send("It's too soon to give up! Try again "+timeString(3600000-timePassed)+" later.");
				return;
			}
		}
		console.log("quest start");
		var randomID;
		//target must not be itself
		while(randomID==undefined || randomID==msg.author.id)randomID=arrayID[Math.floor(Math.random()*arrayID.length)];
		//target id, kill needed, flavor
		quest[msg.guild.id][msg.author.id]=[randomID,Math.ceil(Math.random()*3+1)*5,questFlavor[Math.floor(Math.random()*questFlavor.length)],new Date().getTime()];
		questDone[msg.guild.id][msg.author.id]=0;
		msg.channel.send("Quest started!\nKill "+quest[msg.guild.id][msg.author.id][1]+" "+client.users.get(quest[msg.guild.id][msg.author.id][0]).username+"!\n"+quest[msg.guild.id][msg.author.id][2]);
		//save
		saveQuest();
	}
	
	//quest list
	else if(content=="quest list"){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		console.log("quest list");
		var text="Shared Quest:\n";
		if(questAll[msg.guild.id]!=undefined){
			text+="Kill "+questAll[msg.guild.id][1]+" "+client.users.get(questAll[msg.guild.id][0]).username+"!\n"+questAll[msg.guild.id][2];
			if(questAllDone[msg.guild.id][msg.author.id]==undefined)questAllDone[msg.guild.id][msg.author.id]=0;
			text+="\nKilled: "+questAllDone[msg.guild.id][msg.author.id];
		}
		else text+="None";
		text+="\n\nPersonal Quest:\n";
		if(quest[msg.guild.id][msg.author.id]!=undefined)
			text+="Kill "+quest[msg.guild.id][msg.author.id][1]+" "+client.users.get(quest[msg.guild.id][msg.author.id][0]).username+"!\n"+quest[msg.guild.id][msg.author.id][2]+"\nKilled: "+questDone[msg.guild.id][msg.author.id];
		else text+="None";
		msg.channel.send("```"+text+"```");
	}
	
	/*//transfer
	else if(content.startsWith("transfer ")){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		if(content.startsWith("transfer eris")){
			var passed=true;
			//check no mention
			if(msg.mentions.users.array().length==0 || !content.startsWith("transfer eris <@"))
				passed=false;
			//check sum
			var sum=content.substr(content.indexOf(">")+2).trim().split(" ")[0];
			if(isNaN(parseInt(sum)) || !isFinite(sum) || sum.indexOf(".")>=0 || !passed){
				//usage help
				msg.channel.send("```Usage:\ntransfer eris <mention> <sum>\n\nInfo:\ntransfer eris to others```");
				return;
			}
			sum=parseInt(sum);
			var targetID=msg.mentions.users.firstKey();
			var targetUser=client.users.get(targetID);
			//check enough balance
			if(adventurer[msg.guild.id][msg.author.id].eris<sum){
				msg.channel.send(msg.author+" short on money? Do some quest!");
				return;
			}
			//check target is not self
			if(msg.author.id==targetID){
				msg.channel.send(msg.author+" *throws back your money*");
				return;
			}
			//check target is adventurer
			if(adventurer[msg.guild.id][targetID]==undefined){
				msg.channel.send(targetUser+" is not an adventurer!");
				return;
			}
			console.log("transfer eris");
			adventurer[msg.guild.id][msg.author.id].eris-=sum;
			adventurer[msg.guild.id][targetID].eris+=sum;
			msg.channel.send(msg.author+" has given "+targetUser+" "+sum+" eris. Be thankful!");
			//save
			saveData();
		}
		else if(content.startsWith("transfer pantsu")){
			var passed=true;
			//check no mention
			if(msg.mentions.users.array().length==0 || !content.startsWith("transfer pantsu <@"))
				passed=false;
			//check sum
			var sum=content.substr(content.indexOf(">")+2).trim().split(" ")[0];
			if(isNaN(parseInt(sum)) || !isFinite(sum) || sum.indexOf(".")>=0 || !passed){
				//usage help
				msg.channel.send("```Usage:\ntransfer pantsu <mention> <sum>\n\nInfo:\ntransfer pantsu to others```");
				return;
			}
			sum=parseInt(sum);
			var targetID=msg.mentions.users.firstKey();
			var targetUser=client.users.get(targetID);
			//check enough pantsu
			if(adventurer[msg.guild.id][msg.author.id].pantsu<sum){
				msg.channel.send(msg.author+" you don't have the *goods*, go steal some!");
				return;
			}
			//check target is not self
			if(msg.author.id==targetID){
				msg.channel.send(msg.author+" *throws back your pantsu*");
				return;
			}
			//check target is adventurer
			if(adventurer[msg.guild.id][targetID]==undefined){
				msg.channel.send(targetUser+" is not an adventurer!");
				return;
			}
			console.log("transfer pantsu");
			adventurer[msg.guild.id][msg.author.id].pantsu-=sum;
			adventurer[msg.guild.id][targetID].pantsu+=sum;
			msg.channel.send(msg.author+" has *sneakily* given "+targetUser+" "+sum+" pantsu(s). Be grateful!");
			//save
			saveData();
		}
	}*/
	
	//shop list
	else if(content=="shop list" && eventStatus[msg.guild.id]==1){
		msg.channel.send("To buy use `shop <item number>` command\n"+
		"```Welcome to Wiz Shop!\n\n"+
		"1. Potion      (100 eris) Restores HP\n"+
		"2. Wiz Special (9 pantsu) Permanently increase random stat (limited offer)\n"+
		"\n(item will vaporate after the event ended)```");
	}
	
	//shop buy
	else if(content.startsWith("shop ") && eventStatus[msg.guild.id]==1){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		var number=content.substr(5);
		if(number=="1"){
			//potion
			//check eris
			var price=100;
			if(adventurer[msg.guild.id][msg.author.id].eris<price){
				msg.channel.send(msg.author+" short on money? Go home!");
				return;
			}
			if(participator[msg.guild.id][msg.author.id]==undefined){
				participator[msg.guild.id][msg.author.id]=new LiveAdv(adventurer[msg.guild.id][msg.author.id]);
			}
			adventurer[msg.guild.id][msg.author.id].eris-=price;
			participator[msg.guild.id][msg.author.id].potion++;
			msg.channel.send(msg.author+" bought potion!");
			//save
			saveData();
		}
		else if(number=="2"){
			//Wiz Special
			//check pantsu
			var price=9;
			if(adventurer[msg.guild.id][msg.author.id].pantsu<price){
				msg.channel.send(msg.author+" short on pantsu? ¯\\\_(ツ)\_/¯");
				return;
			}
			adventurer[msg.guild.id][msg.author.id].pantsu-=price;
			adventurer[msg.guild.id][msg.author.id].randomGain();
			msg.channel.send(msg.author+" bought Wiz Special... He feels kinda stronger");
			//save
			saveData();
		}
	}
	
	//command list
	else if(content=="command list" && eventStatus[msg.guild.id]==2){
		msg.channel.send("```Commands:\n\n"+
		"fight event  fight the boss\n"+
		"check party  see party's HP\n"+
		"use potion   use your potion on someone\n"+
		"revive       revive comrades for 10,000 eris (not self)\n"+
		"```");
	}
	
	//check party
	else if(content=="check party" && eventStatus[msg.guild.id]>=1){
		var text="```\n";
		for(x in participator[msg.guild.id]){
			text+=client.users.get(x).username+"\n"+participator[msg.guild.id][x].stat(adventurer[msg.guild.id][x])+"\n\n";
		}
		msg.channel.send(text+"```");
	}
	
	//potion
	else if(content.startsWith("use potion") && eventStatus[msg.guild.id]==2){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		if(participator[msg.guild.id][msg.author.id]==undefined){
			participator[msg.guild.id][msg.author.id]=new LiveAdv(adventurer[msg.guild.id][msg.author.id]);
		}
		//check target
		if(msg.mentions.users.array().length>0) {
			var mentionID=msg.mentions.users.firstKey();
			var mentionUser=client.users.get(mentionID);
			//check mentioned is not adventurer
			if(adventurer[msg.guild.id][mentionID]!=undefined){
				if(participator[msg.guild.id][mentionID]==undefined){
					participator[msg.guild.id][mentionID]=new LiveAdv(adventurer[msg.guild.id][mentionID]);
				}
				var result=participator[msg.guild.id][msg.author.id].usePotion(adventurer[msg.guild.id][mentionID],participator[msg.guild.id][mentionID]);
				if(result.indexOf("dead")<0 && result.indexOf("any"))
					msg.channel.send(msg.author+result+mentionUser+"```"+mentionUser.username+"\n"+participator[msg.guild.id][mentionID].stat(adventurer[msg.guild.id][mentionID])+"```");
				else msg.channel.send(msg.author+result);
			}
			else msg.channel.send(mentionUser+" is not an adventurer!");
		}
		//self
		else if(adventurer[msg.guild.id][msg.author.id]!=undefined){
			var result=participator[msg.guild.id][msg.author.id].usePotion(adventurer[msg.guild.id][msg.author.id],participator[msg.guild.id][msg.author.id]);
			if(result.indexOf("dead")<0 && result.indexOf("any"))
				msg.channel.send(msg.author+result+"\n```"+msg.author.username+"\n"+participator[msg.guild.id][msg.author.id].stat(adventurer[msg.guild.id][msg.author.id])+"```");
			else msg.channel.send(msg.author+result);
		}
	}
	
	//revive
	else if(content.startsWith("revive ") && eventStatus[msg.guild.id]==2){
		//check is adventurer
		if(adventurer[msg.guild.id][msg.author.id]==undefined){
			msg.channel.send(msg.author+" is not an adventurer! Use `new adventurer` command!");
			return;
		}
		if(participator[msg.guild.id][msg.author.id]==undefined){
			participator[msg.guild.id][msg.author.id]=new LiveAdv(adventurer[msg.guild.id][msg.author.id]);
		}
		//check target
		if(msg.mentions.users.array().length>0) {
			var mentionID=msg.mentions.users.firstKey();
			var mentionUser=client.users.get(mentionID);
			//check mentioned is not adventurer
			if(adventurer[msg.guild.id][mentionID]!=undefined){
				if(participator[msg.guild.id][mentionID]==undefined){
					participator[msg.guild.id][mentionID]=new LiveAdv(adventurer[msg.guild.id][mentionID]);
				}
				//check target dead
				if(participator[msg.guild.id][mentionID].hp>0){
					msg.channel.send(mentionUser+" is not dead yet, baka!");
					return;
				}
				//check mentioned is yourself
				if(mentionID==msg.author.id){
					msg.channel.send(msg.author+" you are now a corpse. So stay still.");
					return;
				}
				//check money
				var price=10000;
				if(adventurer[msg.guild.id][msg.author.id].eris<price){
					msg.channel.send(msg.author+" Aqua doesn't feel you have enough ~~money~~ faith");
					return;
				}
				adventurer[msg.guild.id][msg.author.id].eris-=price;
				participator[msg.guild.id][mentionID].revive(adventurer[msg.guild.id][mentionID]);
				msg.channel.send(msg.author+" called Aqua to revive "+mentionUser+"\nThank you for your patronage\n```"+mentionUser.username+"\n"+participator[msg.guild.id][mentionID].stat(adventurer[msg.guild.id][mentionID])+"```");
			}
			else msg.channel.send(mentionUser+" is not an adventurer!");
		}
		//usage
		else {
			msg.channel.send("```Usage:\nrevive <mention>```");
		}
	}
	
});

var questFlavor=[
"He has attempted to kidnap the Goddess. Serve him JUSTICE. Or Pizza.",
"Battle-Crazed Idiots ran rampant on the street!",
"The cultists are causing trouble!",
"A wild adventurer appeared!",
"He is WANTED!",
"The guild want 'em dead... Once is not enough."
];

//event char
var LiveAdv=require("./event.js");
var eventChar={};

//event
var event={};
var eventStatus={}; // undefined or 0:none, 1:opened, 2:started
var eventList=[
//type,open,start,closeWin,closeLose,adversaryName
//type 1: boss
[1,"Announcement: A large **DRAGON** has been seen going near this town. The estimated time of its arrival will be within 20 minutes. All available adventurers, please ready your equipment for battle.","**THE DRAGON IS HERE!!!!!!**","The dragon has been slain... Good job!","The dragon lose interest and left...","Dragon"],

//type 2: swarm
[2,"I apologize for gathering everyone on such short notice! I think everyone should know the emergency is because of the **CABBAGES**! Each one is worth 10,000 Eris! They will be ripe within 20 minutes.","It is time to harvest **CABBAGES**! Serve them on plate!","All cabbage have been caught! Fried cabbages is delicious!","The cabbages have flown faraway...","Cabbage"],

//type 2: cicada
[3,"There are a lot of **CICADAS** in the forest! Because of the large quantity, we need a lot of people. We will start in 20 minutes!","It is time to hunt the **CICADAS**!","Cicadas exterminated! You arrogant and greedy humans.","And thus, cicadas continue to pee while flying about...","Cicada"]
];

function getDragon(adv){
	var dragon=new Adventurer();
	var length=0;
	dragon.set(0,0,0,0,0,0,0,0);
	for(x in adv){
		dragon.level+=adv[x].level;
		dragon.strength+=adv[x].strength;
		dragon.health+=adv[x].health;
		dragon.magicpower+=adv[x].magicpower;
		dragon.dexterity+=adv[x].dexterity;
		dragon.agility+=adv[x].agility;
		dragon.luck+=adv[x].luck;
		dragon.eris+=adv[x].eris;
		length++;
	}
	dragon.strength=Math.ceil(dragon.strength/length/3);
	dragon.health*=10;
	dragon.magicpower=Math.ceil(dragon.magicpower/length);
	dragon.dexterity=Math.ceil(dragon.dexterity/length);
	dragon.agility=Math.ceil(dragon.agility/length);
	return dragon;
}

function getCabbage(){
	var cabbage=new Adventurer();
	cabbage.set(1,0,1,1,1,10,10000,10000);
	return cabbage;
}

function getCicada(){
	var cicada=new Adventurer();
	cicada.set(50,0,100,1000,100,100,100,1);
	return cicada;
}

var closingEvent={};
var participator={};
var adversaries={};

function openEvent(guild){
	if(!checkChannel(guild))return;
	console.log("open event");
	eventStatus[guild]=1;
	participator[guild]={};
	//random event
	event[guild]=eventList[Math.floor(Math.random()*eventList.length)];
	botChannel[guild].send("`Raid Event` @here\n"+event[guild][1]+"\nEquipment shop has opened! Use `shop list` command");
	
	var eventTime=1200000; //20 mins
	setTimeout(function(){startEvent(guild);},eventTime);
}

function startEvent(guild){
	if(!checkChannel(guild))return;
	console.log("start event");
	eventStatus[guild]=2;
	botChannel[guild].send("`Raid Event` @here\n"+event[guild][2]+"\nEveryone have evacuated, so equipment shop has closed!\nUse `command list` command to see what you can do!");
	//adversaries
	if(event[guild][0]==1){
		var enemy=getDragon(adventurer[guild]);
		adversaries[guild]=[enemy,new LiveAdv(enemy),1];
	}
	else if(event[guild][0]==2){
		var enemy=getCabbage();
		adversaries[guild]=[enemy,new LiveAdv(enemy),Math.ceil(Math.random()*15)+15];
		botChannel[guild].send(adversaries[guild][2]+" cabbages sighted!");
	}
	else if(event[guild][0]==3){
		var enemy=getCicada();
		adversaries[guild]=[enemy,new LiveAdv(enemy),Math.ceil(Math.random()*15)+15];
		botChannel[guild].send(adversaries[guild][2]+" cicadas sighted!");
	}
	
	var eventTime=3600000; //duration 1 hrs
	closingEvent[guild]=setTimeout(function(){closeEvent(guild,false);},eventTime);
}

function closeEvent(guild,win){
	if(!checkChannel(guild))return;
	console.log("close event");
	eventStatus[guild]=0;
	if(win){
		//reward
		var reward=0;
		//dragon
		if(event[guild][0]==1){
			var length=0;
			for(x in participator[guild])length++;
			//1 mil
			reward=Math.ceil(1000000/length);
		}
		//cabbage
		else if(event[guild][0]==2)reward=100;
		//cicada
		else if(event[guild][0]==3)reward=200*adversaries[guild][0].level;
		for(x in participator[guild]){
			if(participator[guild][x].hp>0 && participator[guild][x].participate)adventurer[guild][x].eris+=reward;
		}
		botChannel[guild].send("`Raid Event` @here\n"+event[guild][3]+"\n\n"+reward+" eris for everyone participated! (if you are alive)");
		//save
		saveData();
	}
	else botChannel[guild].send("`Raid Event` @here\n"+event[guild][4]);
	
	var eventTime=Math.ceil(Math.random()*35400000)+600000; //10 mins~10 hrs
	console.log("event "+timeString(eventTime));
	setTimeout(function(){openEvent(guild);},eventTime);
}

var game="with pantsu";

client.on('ready', () => {
	console.log('TO BATTLE!');
	client.user.setActivity(game);
	loadChannel();
});

//load
var token;
var tokenReader = require('readline').createInterface({
	input: fs.createReadStream('./token.txt')
});
tokenReader.on('line', function (line) {
	if(token==undefined){
		token=line;
		client.login(token);
	}
});
