var Adventurer=require("./adventurer.js");

function LiveAdventurer(adv){
	this.hp = adv.health;
	this.potion=0;
}

LiveAdventurer.prototype.stat = function(adv){
	if(this.hp<=0)return "DEAD";
	else return "HP: "+this.hp+" / "+adv.health+" ("+this.potion+" potions)";
}

LiveAdventurer.prototype.hpInfo = function(adv){
	if(this.hp<=0)return "DEAD";
	else return "HP: "+this.hp+" / "+adv.health;
}

LiveAdventurer.prototype.combat = function(name1, name2, adv, target, liveTarget){
	var battleLog="";
	var move=Math.floor(Math.random()*2);
	var result;
	if(move==0)result=this.attack(name1, name2, adv,target,liveTarget);
	else if(move==1)result=this.magic(name1, name2, adv,target,liveTarget);
	battleLog+=result;
	//check dead
	if(liveTarget.hp<=0)return battleLog;
	//counter
	move=Math.floor(Math.random()*2);
	if(move==0)result=liveTarget.attack(name2, name1, target,adv,this);
	else if(move==1)result=this.magic(name2, name1, target,adv,this);
	battleLog+="\n"+result;
	
	return battleLog+"\n\n"+this.stat(adv);
}

LiveAdventurer.prototype.attack = function(name1, name2, adv, target, liveTarget){
	var randomizer=Math.random()+0.5;
	var multiplier=Math.ceil(0.5*adv.dexterity/target.agility);
	var damage=Math.ceil(adv.strength*multiplier*randomizer);
	//critical
	if(Math.random()*(adv.luck+target.luck*10)<adv.luck){
		damage*=3;
		liveTarget.hp-=damage;
		return name1+" attacked "+name2+". Critical! "+name2+" took "+damage+" damage...";
	}
	//miss
	else if(Math.random()*(this.dexterity*10+target.agility)<target.agility){
		return name1+" attacked "+name2+". But missed...";
	}
	//normal attack
	else {
		liveTarget.hp-=damage;
		return name1+" attacked "+name2+". "+name2+" took "+damage+" damage...";
	}
}

LiveAdventurer.prototype.magic = function(name1, name2, adv, target, liveTarget){
	var randomizer=Math.random()+0.5;
	var multiplier=1;
	var damage=Math.ceil(adv.magicpower*multiplier*randomizer);
	liveTarget.hp-=damage;
	return name1+" used a magic! "+name2+" took "+damage+" damage!";
}

LiveAdventurer.prototype.usePotion = function(target, liveTarget){
	//check dead
	if(this.hp<0)return " you are dead!";
	//check target dead
	else if(liveTarget.hp<0)return " target already dead! There's no saving him (for now)";
	//check have potion
	else if(this.potion>=1){
		liveTarget.hp=target.health;
		this.potion--;
		return " have used potion on ";
	} else return " you don't have any potion!";
}

module.exports=LiveAdventurer;