/* Korta, omformulerade elevförklaringar utifrån Flodkulturer (Egypten), s. 2–13.
   PDF och bilder ingår inte. Ändra eller lägg till poster med ett unikt, stabilt id. */
'use strict';
const CATEGORIES = {nature:'Jordbruk & floder',society:'Makt & samhälle',culture:'Skrift & tro'};
const TERMS = [
  ['flodkultur','Flodkultur','Ett samhälle som växte fram längs en flod och använde vattnet till bland annat jordbruk.','nature','8, 13','Egypten och Mesopotamien är exempel på flodkulturer.'],
  ['jordbruk','Jordbruk','Att odla växter och hålla djur för att få exempelvis mat.','nature','2–3','Bönder odlar säd och håller boskap.'],
  ['bofast','Bofast','Att bo kvar på samma plats i stället för att flytta omkring.','nature','2','När människor började odla kunde de bosätta sig nära åkrarna.'],
  ['halvmanen','Den bördiga halvmånen','Ett område i Mellanöstern där tidigt jordbruk utvecklades.','nature','2','Namnet beskriver ett bördigt område som sträcker sig i en båge.'],
  ['utsade','Utsäde','Frön som sparas för att så en ny skörd.','nature','2','En bonde sparar en del av säden för nästa sådd.'],
  ['tamboskap','Tamboskap','Djur som människor håller och föder upp, exempelvis kor.','nature','2','Boskap kunde ge människor mat och andra resurser.'],
  ['konstbevattning','Konstbevattning','Att leda vatten till odlingar med hjälp av exempelvis kanaler.','nature','3, 8','Bönderna leder vatten från floden till torra åkrar.'],
  ['kanal','Kanal','En grävd vattenväg som kan leda vatten till åkrar.','nature','3, 8','En kanal hjälper människor att fördela flodens vatten.'],
  ['slam','Slam','Fint material som följer med vatten och kan göra jorden näringsrik.','nature','3','När floden sjunker undan kan näringsrikt slam ligga kvar på åkern.'],
  ['oversvamning','Översvämning','När vatten stiger och täcker mark som annars är torr.','nature','3, 8','Nilens vatten täckte regelbundet marken längs floden.'],
  ['delta','Delta','Ett område vid en flods mynning där floden delar upp sig i flera grenar.','nature','8','Nilen bildar ett delta innan den når Medelhavet.'],
  ['overskott','Överskott','Det som blir över när behoven är täckta, till exempel mat som inte behövs direkt.','nature','11–12','Matöverskott gjorde att en del kunde arbeta som skrivare i stället för bönder.'],
  ['stadsstat','Stadsstat','En stad och området runt omkring som tillsammans bildar en egen stat.','society','3','Ur och Uruk var sumeriska stadsstater.'],
  ['farao','Farao','Härskaren i det forntida Egypten, som också betraktades som gudomlig.','society','5','Farao hade stor makt över marken och människornas arbete.'],
  ['ambetsman','Ämbetsman','En person som sköter uppgifter åt härskaren, till exempel att samla in skatt.','society','3, 5','En ämbetsman kunde hålla reda på vad bönderna betalade.'],
  ['skatt','Skatt','Något människor lämnar till den som styr, till exempel en del av skörden.','society','3, 5','Skatten kunde användas för att försörja dem som arbetade åt härskaren.'],
  ['arrendera','Arrendera','Att hyra mark som någon annan äger.','society','5','En bonde odlar på härskarens jord och betalar för att använda den.'],
  ['livegen','Livegen','En person som är bunden till en jordägare och har begränsad frihet att flytta och bestämma över sitt arbete.','society','8','En livegen bonde kunde inte fritt välja att flytta.'],
  ['aganderatt','Privat äganderätt','Rätten för en enskild person att äga något.','society','4','Mark och andra tillgångar kunde ha privata ägare.'],
  ['lagsamling','Lagsamling','Flera nedskrivna lagar som samlats tillsammans.','society','4','Hammurabis lagar är en känd lagsamling från Babylonien.'],
  ['oga','Öga för öga, tand för tand','En straffprincip där straffet ska motsvara skadan som någon har orsakat.','society','4','Principen kopplar straffet till den skada som brottet har lett till.'],
  ['inbordeskrig','Inbördeskrig','Krig mellan grupper inom samma land.','society','5–6','Strider inom Egypten kunde försvaga riket.'],
  ['hungersnod','Hungersnöd','Allvarlig brist på mat som drabbar många människor.','society','5','Dåliga skördar kan bidra till hungersnöd.'],
  ['strejk','Strejk','När arbetare gemensamt slutar arbeta för att kräva en förändring.','society','6','Arbetare kunde vägra arbeta när de inte fick sin betalning i mat.'],
  ['skriftsprak','Skriftspråk','Ett sätt att uttrycka och bevara språk med skrivna tecken.','culture','3, 11','Skrift gjorde det lättare att bevara information om handel och skatter.'],
  ['kilskrift','Kilskrift','Ett skriftsystem från Mesopotamien med kilformade tecken, ofta skrivna i lera.','culture','3','Sumeriska skrivare gjorde tecken i lertavlor.'],
  ['hieroglyfer','Hieroglyfer','Egyptiska skrivtecken som bland annat föreställer människor, djur och föremål.','culture','8, 11','Hieroglyfer kunde ristas eller målas på gravar och tempel.'],
  ['skrivare','Skrivare','En person som hade utbildats för att skriva och dokumentera information.','culture','8, 11','Skrivaren kunde dokumentera hur mycket skatt som samlats in.'],
  ['papyrus','Papyrus','Ett skrivmaterial som tillverkades av papyrusväxten.','culture','11','En skrivare kunde skriva på en papyrusrulle.'],
  ['rosettastenen','Rosettastenen','En sten med samma text i tre olika skrifter som hjälpte forskare att tyda hieroglyfer.','culture','11–12','Genom att jämföra skrifterna kunde forskare förstå egyptiska tecken.'],
  ['tempel','Tempel','En religiös byggnad där man dyrkade gudar.','culture','3, 9','Tempel kunde också äga mark och ha många anställda.'],
  ['zikkurat','Zikkurat','Ett stort tempeltorn i Mesopotamien.','culture','3','Zikkuraten hörde till stadsstatens religiösa liv.'],
  ['pyramid','Pyramid','Ett stort byggnadsverk som i Egypten användes som grav åt faraoner.','culture','5, 13','Cheops pyramid byggdes som en kunglig grav.'],
  ['balsamering','Balsamering','Att behandla en död kropp för att bevara den.','culture','9','I Egypten torkade man bland annat ut kroppen för att bevara den.'],
  ['mumie','Mumie','En död kropp som har bevarats genom uttorkning eller annan behandling.','culture','9','Balsamering kunde göra att kroppen bevarades som en mumie.'],
  ['dodsriket','Dödsriket','Den värld där de döda ansågs fortsätta sin tillvaro enligt religionen.','culture','9','Tron på ett liv efter döden påverkade hur egyptierna begravde sina döda.']
].map(([id,term,definition,category,pages,example])=>({id,term,definition,category,pages,example}));
if(typeof module!=='undefined') module.exports={TERMS,CATEGORIES};
