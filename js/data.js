// Static content: scenarios, personality archetypes, hidden circumstances,
// grading categories and the Playbook lessons.

export const SCENARIOS = [
  {
    id: 'match-you-first',
    title: 'New match: you go first',
    short: 'You just matched. Send the first message.',
    skin: 'app',
    herFirst: false,
    icon: '💬',
    setup: 'You both swiped right on a dating app. Nothing has been said yet. You open the chat and it is your move.',
    interest: { into: 20, open: 40, polite: 25, not: 15 },
  },
  {
    id: 'match-she-first',
    title: 'New match: she messaged first',
    short: 'You matched and she broke the ice.',
    skin: 'app',
    herFirst: true,
    icon: '✨',
    setup: 'You both swiped right on a dating app and she sent the first message. Your reply sets the tone.',
    interest: { into: 35, open: 40, polite: 20, not: 5 },
  },
  {
    id: 'bar-number',
    title: 'Met at a bar',
    short: 'Met through a mutual friend, got her number.',
    skin: 'sms',
    herFirst: false,
    icon: '🍸',
    setup: 'You met her at a bar through a mutual friend, talked for a while and got her number. This is the first text since that night.',
    interest: { into: 30, open: 35, polite: 25, not: 10 },
  },
  {
    id: 'setup',
    title: 'Friend set you up',
    short: 'A friend connected you two to see if you click.',
    skin: 'sms',
    herFirst: false,
    icon: '🤝',
    setup: 'A friend thinks you two would be great together and shared your numbers. She knows you might text her.',
    interest: { into: 20, open: 40, polite: 30, not: 10 },
  },
  {
    id: 'after-date',
    title: 'After the first date',
    short: 'Date one went great (you think). Now text her.',
    skin: 'sms',
    herFirst: false,
    icon: '🌙',
    setup: 'You went on a first date a couple of days ago and from your side it went great. Now you are texting her again.',
    interest: { into: 45, open: 30, polite: 15, not: 10 },
  },
];

export const INTEREST_LEVELS = {
  into: { value: 72, label: 'Into him' },
  open: { value: 52, label: 'Open, needs to be won over' },
  polite: { value: 34, label: 'Polite but lukewarm' },
  not: { value: 18, label: 'Not really interested' },
};

export const ARCHETYPES = [
  {
    id: 'witty',
    label: 'The Witty One',
    about: 'Quick and sarcastic, loves banter. She teases to see if a guy can play along without getting defensive or trying too hard. Bored by interview questions.',
    style: 'Mostly lowercase, dry humor, "lol", "ok but", "stop", rare emojis. Short punchy lines.',
  },
  {
    id: 'sweetheart',
    label: 'The Sweetheart',
    about: 'Warm and friendly with everyone, which makes it hard to tell real interest from politeness.',
    style: 'Exclamation points, emojis like 😊🥰😂, enthusiastic, asks friendly questions.',
  },
  {
    id: 'busy-pro',
    label: 'The Busy Professional',
    about: 'Works long hours in a demanding career. Not rude, just busy. Respects a man who gets to the point and makes a plan. Endless small talk loses her.',
    style: 'Short replies, proper punctuation, sometimes replies hours later. Practical.',
  },
  {
    id: 'shy',
    label: 'The Shy One',
    about: 'Reserved and takes time to open up. Short answers early that get longer as she gets comfortable. Intensity overwhelms her.',
    style: 'Short, lowercase, "haha", "yeah", rarely asks questions back early on.',
  },
  {
    id: 'guarded',
    label: 'The Guarded One',
    about: 'Has been burned by players. Skeptical of smooth lines and over-the-top compliments. Rewards sincerity and consistency.',
    style: 'Measured and neutral, will call out a line ("does that usually work?"). Warms up slowly.',
  },
  {
    id: 'social',
    label: 'The Social Butterfly',
    about: 'Fun, outgoing, always has plans and options. Can be flaky. Responds to energy and fun ideas, easily distracted.',
    style: 'Emojis, "omg", "hahaha", sends several short bubbles in a row.',
  },
  {
    id: 'faith',
    label: 'The Values-Driven One',
    about: 'Faith and family matter a lot to her. Looking for something serious with a man who has direction and leads. Hookup energy turns her off fast.',
    style: 'Kind and thoughtful, normal punctuation, occasional emoji.',
  },
  {
    id: 'adventurer',
    label: 'The Adventurer',
    about: 'Outdoorsy and spontaneous. Hates small talk, loves specific, fun plans.',
    style: 'Energetic, casual, some emojis like 🏔️🌊, sends photos-in-words ("just got back from a hike").',
  },
  {
    id: 'dry',
    label: 'The Dry Texter',
    about: 'Great in person, bad at texting. Short replies even when she is interested. Teaches you not to over-read texts and to move to plans.',
    style: '"lol", "yeah", "nice", "true", rarely asks questions, no emojis.',
  },
  {
    id: 'high-standards',
    label: 'The Head-Turner',
    about: 'Very attractive and used to attention. Has a lot of options and tests whether a guy has a backbone and his own life.',
    style: 'Confident, a little teasing, sometimes one-word replies, makes you work for it.',
  },
  {
    id: 'creative',
    label: 'The Creative Homebody',
    about: 'Artistic and introverted. Loves deep, specific conversation, dislikes generic openers.',
    style: 'Thoughtful, sometimes longer messages, lowercase, ":)" style emoticons.',
  },
];

export const CIRCUMSTANCES = [
  { w: 6, text: 'Nothing unusual. She is open to dating and has a normal amount of time.' },
  { w: 2, text: 'She is also talking to a couple of other guys and one of them is ahead right now.' },
  { w: 1, text: 'She recently got out of a relationship and is not sure she is ready.' },
  { w: 1, text: 'She is having a brutal week at work and has little energy for texting.' },
  { w: 2, text: 'She is looking for something serious and is quietly screening for intentions.' },
  { w: 1, text: 'She mostly wants attention or friends right now, not dating, though she will not say so directly.' },
  { w: 1, text: 'She is just not physically attracted to him, even though she thinks he seems nice.' },
];

export const RED_FLAGS = [
  'Runs hot and cold on purpose to keep guys chasing.',
  'Hints at what guys usually buy or do for her, and measures men by what she can get.',
  'Trash-talks her exes and takes no responsibility for anything that went wrong.',
  'Fishes for compliments and makes the conversation all about herself.',
  'Flaky: makes plans loosely and backs out without much apology.',
  'Tells small lies to look better (about plans, how busy she is, etc).',
];

export const CATEGORIES = [
  { key: 'authenticity', label: 'Authenticity', blurb: 'Being yourself: no lines, no performing' },
  { key: 'curiosity', label: 'Curiosity', blurb: 'Real interest in her and what she says' },
  { key: 'charisma', label: 'Charisma', blurb: 'Warmth, humor, playfulness, energy' },
  { key: 'leadership', label: 'Leadership', blurb: 'Initiative, clear plans, asking her out' },
  { key: 'reading', label: 'Reading signals', blurb: 'Noticing interest vs. politeness' },
  { key: 'balance', label: 'Balance', blurb: 'Not over-investing or overthinking' },
  { key: 'respect', label: 'Respect', blurb: 'Healthy forwardness, honoring her comfort' },
];

export const FIRST_NAMES = [
  'Emily', 'Jess', 'Sofia', 'Maya', 'Ava', 'Kayla', 'Brooke', 'Hannah', 'Olivia', 'Alyssa',
  'Gabriela', 'Priya', 'Jasmine', 'Taylor', 'Madison', 'Rachel', 'Natalie', 'Lauren', 'Chloe',
  'Mia', 'Sarah', 'Aaliyah', 'Camila', 'Grace', 'Abby', 'Leah', 'Kennedy', 'Bella', 'Nina', 'Riley',
];

export const PLAYBOOK = [
  {
    id: 'be-normal',
    emoji: '🧠',
    title: 'Stop looking for the perfect line',
    minutes: 2,
    body: [
      'Most guys lose a conversation in their own head. They draft, delete, google "best reply" and send something that sounds like it came from a script. She can tell.',
      'Text like you talk to a friend you like. Short, specific, a little playful. If you would not say it across a table, do not send it.',
      'A normal message sent with confidence beats a clever one sent with anxiety. Your goal is not to impress her. It is to find out whether you two click.',
      'Quick test before you hit send: is this true, is it me, and would I be fine if she does not reply? If yes, send it.',
    ],
  },
  {
    id: 'first-message',
    emoji: '👋',
    title: 'The first message',
    minutes: 2,
    body: [
      '"Hey" puts all the work on her. A paragraph puts too much pressure on her. Aim for one or two lines that show you actually looked at her profile, or that you remember the night you met.',
      'Good: pick one specific detail and react to it with personality. "Okay, you hiked Angels Landing. Respect. Were you scared on the chains or is that just me?"',
      'Skip the generic compliment on her looks as an opener. She gets dozens of them. Notice something about her as a person instead.',
      'If you met in person, reference it. "Hey it\'s Jake from Saturday. Did you ever settle the pineapple-on-pizza debate with Sarah?"',
    ],
  },
  {
    id: 'curiosity',
    emoji: '🔍',
    title: 'Curiosity beats impressing',
    minutes: 2,
    body: [
      'People feel attracted to people who make them feel interesting. Ask about things she actually cares about, then follow up on what she says instead of jumping to the next question.',
      'Avoid the interview: question, answer, new question, answer. Mix in your own take, a story or a tease, so it feels like a conversation, not a form.',
      'Bragging about your car, salary or gym numbers almost always lowers interest. Let those things come out naturally in person.',
    ],
  },
  {
    id: 'charisma',
    emoji: '⚡',
    title: 'What charisma looks like over text',
    minutes: 3,
    body: [
      'Charisma is warmth plus confidence plus presence. Over text it shows up as being specific, being playful, having opinions and enjoying the conversation instead of grading it.',
      'Warmth: genuine reactions ("no way, that\'s awesome"), remembering details, kindness.',
      'Confidence: you do not over-explain, you do not apologize for existing, you are fine with a little silence, you lead.',
      'Playfulness: light teasing and inside jokes. Teasing is about a shared moment, never about putting her down.',
      'Not charismatic: walls of text, constant "haha sorry", agreeing with everything, fishing for reassurance, or trying to sound impressive.',
    ],
  },
  {
    id: 'lead',
    emoji: '🧭',
    title: 'Lead: ask her out clearly',
    minutes: 2,
    body: [
      'Texting is not the relationship. Its job is to get you in front of each other. Once there is some back-and-forth energy, ask her out. Usually that is within the first day or two of good conversation.',
      'Be specific. "We should hang out sometime" is a maybe. "I\'d like to take you to that taco place on 5th, are you free Thursday around 7?" is a plan. Specific plans show you are a man with direction.',
      'If she says yes, confirm and stop texting so much. Save it for the date.',
      'If she says "maybe" or "this week is crazy" without offering another time, that is usually a soft no. Leave the door open once ("No worries, let me know when things calm down") and then let her come to you.',
    ],
  },
  {
    id: 'signals',
    emoji: '📡',
    title: 'Reading interest vs. politeness',
    minutes: 3,
    body: [
      'Signs she is interested: she asks you questions back, she adds energy (emojis, jokes, longer replies), she remembers details, she suggests or happily accepts plans, she starts conversations sometimes.',
      'Signs she is just being polite: short answers with no questions back, slow replies that never get warmer, vague answers to plans, conversations always starting from you.',
      'One dry reply means nothing. Look at the trend over several messages.',
      'Some people are just bad texters (see the Dry Texter). If she says yes to plans, that matters more than how she texts.',
    ],
  },
  {
    id: 'friend-zone',
    emoji: '🫂',
    title: 'Friendship vs. romance and why both matter',
    minutes: 3,
    body: [
      'A friendly woman is warm, chatty and kind, but she keeps things in "buddy" territory: no flirting back, talks about other guys, deflects plans that sound like dates and suggests group hangs instead.',
      'Romantic interest looks different: she flirts back, there is some tension, she makes time for one-on-one plans and she cares about your attention.',
      'If it is friendship, that is not a failure. Good women make great friends, they expand your social circle and they make you better with women in general. The only mistake is pretending to be her friend while secretly waiting for more. That is dishonest to both of you.',
      'Be honest with yourself. If you want more and she does not, it is okay to step back gracefully.',
    ],
  },
  {
    id: 'not-on-you',
    emoji: '🌧️',
    title: 'When she loses interest (and it is not on you)',
    minutes: 2,
    body: [
      'Sometimes you do everything right and she still fades. She might be talking to someone else, coming out of a breakup, overwhelmed at work, or just not feeling it. None of that is in your control.',
      'Ghosting usually says more about her bandwidth than your worth.',
      'What is in your control: being yourself, being clear and respectful and not chasing. Grade yourself on that, not on the outcome.',
      'The guys who win at dating are not the ones who never get rejected. They are the ones who do not let rejection change who they are.',
    ],
  },
  {
    id: 'flags',
    emoji: '🚩',
    title: 'Red and green flags in her and in you',
    minutes: 3,
    body: [
      'Red flags: selfishness, lying, signs of cheating, manipulation, immaturity, blaming everyone else, no accountability, pressuring, hot-and-cold games, measuring you by what you can buy her.',
      'Green flags: honesty, compassion, a good listener, notices how others feel, empathy and sympathy, consistency, owns her mistakes.',
      'Nice-to-haves like looks, a great job and an exciting lifestyle are real, but they are not the foundation. Core character is.',
      'Check yourself too. Are you honest about your intentions? Do you own your mistakes? Do you pressure, sulk or guilt-trip when you do not get your way? The best way to attract a woman with green flags is to be a man with green flags.',
    ],
  },
  {
    id: 'forward',
    emoji: '🔥',
    title: 'Healthy forwardness and flirting',
    minutes: 3,
    body: [
      'Women generally like a man who is a little bold: one who says he finds her attractive, makes his intentions clear and is not afraid to flirt. Being too passive can look like a lack of interest.',
      'Match and lead: raise the flirtation one small step at a time, and only when she is matching your energy. If she pulls back, you pull back. No sulking.',
      'Sexual comments early, especially before you have met, are a major red flag to most women. They signal you see her as an object, not a person. Expect to get unmatched or blocked.',
      'Respect is attractive. A man who can be flirty and also takes "no" without any attitude makes a woman feel safe, and safe is attractive.',
    ],
  },
  {
    id: 'in-person',
    emoji: '🤝',
    title: 'On the date: presence and touch',
    minutes: 3,
    body: [
      'Put the phone away, make eye contact, smile and be curious. Treat it like you are getting to know her, not interviewing for a job.',
      'Lead the logistics: pick the place, show up on time, handle the details. Small acts of provision and care go a long way.',
      'Touch should be gradual and responsive: a hand on her back walking through a door, a light touch on the arm when you laugh. Watch how she responds. If she leans in or touches back, she is comfortable. If she stiffens or moves away, give her space.',
      'Never pressure. Ask when unsure. A goodnight hug is a fine ending. Real chemistry does not need to be forced.',
    ],
  },
  {
    id: 'overthinking',
    emoji: '⏳',
    title: 'Double texting, waiting, and overthinking',
    minutes: 2,
    body: [
      'You do not need rules like "wait three hours to reply". Reply when you naturally would. Just do not be glued to your phone.',
      'One follow-up after a long silence is fine and normal, especially if it is light and new ("Saw this and thought of your terrible taste in movies 😂"). A string of "hello?" texts is not.',
      'If she has not answered two of your messages in a row, the ball is in her court. Live your life.',
      'The less your mood depends on her reply, the more attractive you are.',
    ],
  },
];
