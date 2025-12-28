Your first conversation should be in start.txt.

Here is an example of a conversation:
---------
Sarah
mc : Hey $gf!
gf : Hey $mc, how are you?
mc : Listen, I'll show you an example of sending a photo:
mc : $pics = 1.png
gf : Yes, I know, and here's an example of a video:
Girlfriend : $vids = 1.mp4
mc : Oh, that's great, I think I can even make a voice memo—
gf : Absolutely.
Girlfriend: $audio = 1.mp3
mc : We've covered sending multimedia content, let's see the rest in another conversation with our friend Robert.
$talks = lovepath/1.txt
---------

The first line refers to the person with whom you are having the conversation. You can have a conversation with several people by separating their names with commas (for example: Sarah, Robert, Lisa). These names must be exactly the same as those you created in characters.txt.

To make the MC speak, use "mc: TEXT" (respect the spaces).
To make a protagonist speak, use "Name: TEXT" (or "Abbreviation: TEXT").

As long as another protagonist does not speak, all the text you enter, including line breaks, will be in a single message. For example:
----
mc : Hey!
gf : Hey John, hwr?

Did you do what I asked you to do?

I haven't heard from you.
mc : I completely forgot.
----

This will only result in three messages.

Once you have finished the conversation and want to start a new one, enter "$talks = PATH/NAME.txt"

From the "talks" folder, you can create a subfolder called "lovepath" and then "chapter1" and put "1.txt" inside it. To call up the conversation you created in it, the call will be "$talks = lovepath/chapter1/1.txt"

If the MC already has a conversation with the person(s) in this new conversation, it will be reused and moved to the top of the MC's list, like a "new message" in WhatsApp.

The list of functions you can use:
$gf // Allows you to use your girlfriend's custom name.
$mc // Allows you to use the MC's custom name.

$pics = NAME.png // To send a photo. You can use different image formats, so remember to change the .png if necessary. The file must be in a folder named "pics" where the conversation .txt file is located.

$vids = NAME.mp4 // To send a video. The file must be in a folder named "vids" where the conversation .txt file is located.

$audio = NAME.mp3 // To send a voice note. The file must be in a folder named "audio" where the conversation .txt file is located.

$delete // The message just before this function is deleted (the bubble remains with "Message deleted" written on it, as on WhatsApp).
$delete = 3000 // Allows you to set a timer in milliseconds for deletion. This deletion will therefore not wait for the user's "next" action to be triggered.

$status = TEXT // Allows you to put a central bubble in the conversation, for example "TODAY".

$insta = NAME.txt // Sends a notification to the MC of the InstaPics post. They can click on it to be redirected to it, or simply open the InstaPics app and view it themselves. As long as a post is not called in a conversation, it will not appear in the application. Be sure to complete the path if the .txt file was created in subfolders.
$slut = NAME.txt // Same functionality as InstaPics but for OnlySlut.

It is also possible to block certain users who have a code from continuing the game. 

To do this, at the end of a conversation, use "$lock = example.txt". 

You are free to name this file whatever you want, the important thing is to call it correctly ($lock =). Here is an example of content:
----
[GOLD]
$talks = chapter2/example.txt
----

As you can see, at this stage, only members with a gold code (or higher) will be able to access this chapter. The code is stored in Localstorage so that it is not necessary to enter it every time. However, at each stage, the code entered by the user is compared to the database to ensure that their code is still valid.

And below the lock ([GOLD] in our example), the conversation to which the user is redirected if they have access.

The locks that can be used are "BRONZE", "SILVER", "GOLD", "DIAMOND", and "PLATINUM".

$fake.choices =
Choice 1. $/
Choice 2. $/
Choice 3.
// This function allows the MC to submit a response of their choice, but it has no impact on the story. It is intended to enhance immersion. You can include as many choices as you wish, but it is important that each line ends with $/, except for the last one.

/!\ IMPORTANT /!\
Here is an example of a choice-based feature that impacts the story. The explanation is at the end:
$choices =
A. Choice 1 $/
B. Choice 2 $/
C. Choice 3 

path 1
gf : We're in timeline 1!
gf : And look, it's even possible to direct you to a discussion that will only concern this path!
$talks = path1/example.txt
end path

path 2
gf : We're in timeline 2!
gf : And look, it's even possible to direct you to a discussion that will only concern this path!
$talks = path2/example.txt
end path

path 3
gf : We're in timeline 3!
gf : And look, it's even possible to direct you to a discussion that will only concern this path!
$talks = path3/example.txt
end path

As you will have understood, the choices offered work in the same way as for fakechoice, with one exception: you can put "A." "B." or even "1." "2." ... if you want. This will not appear visually when making the choice; it just allows you to identify the choice for the rest of the code.

Next, to continue the custom story for choice A: 
path a // this opens the continuation
end path // this ends the path.

Between these tags, you can create the conversation as you wish. You can even use “$talks = example.txt” to redirect the user to a discussion that only concerns that choice, allowing you to offer a different path for the rest of the story.

If you don't call up a discussion, after "end path" the conversation will revert to being common to all choices for whatever you put after it.

So if I do:
$choices =
A. Choice 1 $/
B. Choice 2

path 1
gf : We're in timeline 1!
gf : And look, it's even possible to direct you to a discussion that will only concern this path!
end path

path 2
gf : We're in timeline 2!
gf : And look, it's even possible to direct you to a discussion that will only concern this path!
end path

gf : We're back in the group discussion. // This point is common to everyone since all paths are complete and have not prompted any new discussion. The discussion could continue for only one of the choices while the other redirects the MC to another conversation.

RESUMÉ RAPIDE DES COMMANDES :
$gf // Allows you to use your girlfriend's custom name.
$mc // Allows you to use the MC's custom name.
$pics = NAME.png // To send a photo. 
$vids = NAME.mp4 // To send a video.
$audio = NAME.mp3 // To send a voice note.
$delete // The message just before this function is deleted.
$delete = 3000 // Allows you to set a timer in milliseconds for deletion. $status = TEXT // Allows you to put a central bubble in the conversation.
$insta = NAME.txt // Sends a notification to the MC of the InstaPics post. $slut = NAME.txt // Same functionality as InstaPics but for OnlySlut.

----
$fake.choices =
Choice 1. $/
Choice 2.
// This function allows the MC to submit a response of their choice, but it has no impact on the story.
----

----
$choices =
A. Choice 1 $/
C. Choice 2

path 1
DISCUSSION
end path

path 2
DISCUSSION
end path
----