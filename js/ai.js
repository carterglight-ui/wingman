// All Claude calls. Three roles:
//   setup  - invents her profile and the scenario details
//   her    - plays her, turn by turn, with a hidden interest level
//   coach  - the sideline "timeout" read, and the final grade
// "Her" and the coach are separate prompts so she never secretly helps him
// and the coaching stays honest.

import Anthropic from './vendor/anthropic.js';
import { store } from './store.js';
import { CATEGORIES } from './data.js';

function client() {
  const { apiKey } = store.settings;
  if (!apiKey) throw new Error('Add your Claude API key in Settings first.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function callJSON({ system, prompt, schema, effort, maxTokens }) {
  let response;
  try {
    response = await client().beta.messages.create({
      model: store.settings.model || 'claude-opus-5-5',
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: { type: 'json_schema', schema } },
      system,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Your API key was rejected. Check it in Settings.');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Too many requests right now. Wait a few seconds and try again.');
    if (err instanceof Anthropic.APIConnectionError) throw new Error('Could not reach the AI. Check your internet connection.');
    if (err instanceof Anthropic.APIError) throw new Error(`AI error (${err.status ?? 'unknown'}): ${err.message}`);
    throw err;
  }
  if (response.stop_reason === 'refusal') {
    throw new Error('The AI declined to continue this conversation. Try ending it and starting a new one.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The AI response was cut off. Please try again.');
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The AI sent back something unreadable. Please try again.');
  }
}

// Shared JSON-schema helpers (structured outputs need additionalProperties: false).
const str = { type: 'string' };
const int = { type: 'integer' };
const strArr = { type: 'array', items: str };
const obj = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

function userLine() {
  const { name, age } = store.settings;
  const bits = [];
  if (name) bits.push(`His first name is ${name}.`);
  if (age) bits.push(`He is ${age} years old.`);
  return bits.join(' ') || 'His name and age are not specified; do not use a name for him unless he gives one.';
}

/* ----------------------------- Setup ----------------------------- */

const SETUP_SCHEMA = obj({
  age: int,
  job: str,
  location: str,
  bio: str,
  prompts: { type: 'array', items: obj({ q: str, a: str }) },
  interests: strArr,
  user_brief: str,
  her_private_take: str,
  opening_message: str,
});

export async function createHer({ scenario, archetype, interest, circumstance, redFlag, name }) {
  const { age } = store.settings;
  const ageHint = age ? `Make her age within about 3 years of ${age}, and at least 21.` : 'Make her between 22 and 32.';
  const system = `You design realistic, varied women for Wingman, a texting-practice app that helps men learn to communicate naturally with women. Everything you create is fictional, adult and grounded in ordinary everyday life. Avoid clichés and make each woman feel like a specific real person with a life of her own.`;
  const prompt = `Create the woman for this practice scenario.

Scenario: ${scenario.title}. ${scenario.setup}
Her first name: ${name}
Personality archetype: ${archetype.label}. ${archetype.about}
Her starting interest in him: ${interest.label}
Hidden circumstance (she does not reveal this directly): ${circumstance}
Hidden character flaw: ${redFlag || 'None in particular. She is a decent person with ordinary flaws.'}
About him: ${userLine()}
${ageHint}

Fill in:
- job, location (a neighborhood or city-area, generic), interests (3-5 specific ones).
- bio: ${scenario.skin === 'app' ? 'her dating-app bio, 1-3 short lines in her voice' : 'a one-line note of what she is like, in plain words'}.
- prompts: ${scenario.skin === 'app' ? 'two dating-app profile prompts with her answers (e.g. "My most irrational fear", "Typical Sunday"). Make them specific and give him something to work with.' : 'an empty array.'}
- user_brief: what HE knows going in, written to him in second person ("You..."), 2-4 sentences. ${
    scenario.id === 'bar-number' ? 'Name the mutual friend and the bar, and one or two things you two talked about.' :
    scenario.id === 'setup' ? 'Name the friend who set you up and what the friend told you about her.' :
    scenario.id === 'after-date' ? 'Describe where the date was, what you talked about and a highlight. From his perspective it went great.' :
    'Mention that you just matched and what caught your eye on her profile.'}
- her_private_take: her honest private view of him and this situation so far, 1-3 sentences, consistent with her interest level and hidden circumstance. (For the after-date scenario, this is how SHE really felt about the date, which may differ from his view.)
- opening_message: ${scenario.herFirst ? 'her first message to him, written exactly how she would text it in her style.' : 'an empty string.'}`;

  return callJSON({ system, prompt, schema: SETUP_SCHEMA, effort: 'low', maxTokens: 8000 });
}

/* ------------------------------ Her ------------------------------ */

const TURN_SCHEMA = obj({
  inner_thought: str,
  interest: int,
  action: { type: 'string', enum: ['reply', 'leave_on_read', 'ghost', 'unmatch', 'block'] },
  delay_minutes: int,
  messages: strArr,
  date_status: { type: 'string', enum: ['none', 'he_asked', 'she_declined', 'she_deflected', 'agreed'] },
});

function herSystem(session) {
  const { her, scenario } = session;
  return `You are ${her.name}, a real ${her.age}-year-old woman texting a guy. This is a realistic texting simulation used by men to practice. Stay fully in character as her at all times. You never mention AI, simulations, coaching or apps beyond the dating app itself.

WHO YOU ARE
- ${her.name}, ${her.age}, ${her.job}, ${her.location}.
- Interests: ${her.interests.join(', ')}.
- Personality: ${her.archetype.label}. ${her.archetype.about}
- Texting style: ${her.archetype.style}
- Hidden circumstance (never state it outright unless it comes up naturally): ${her.circumstance}
- Character flaw you act out subtly: ${her.redFlag || 'none in particular'}
- Your private take on him so far: ${her.privateTake}

THE SITUATION
${scenario.setup}
What he knows going in: ${her.userBrief}
${userLine()}

HOW TO TEXT LIKE A REAL PERSON
- Write exactly like a real woman texts on her phone in your style: short, casual, imperfect. No polished paragraphs, no em dashes, no therapist-speak, no customer-service friendliness.
- You have a life. You do not owe him a question back every time. You do not keep a conversation alive by yourself if he is not giving you anything.
- Usually 1 message, sometimes 2-3 short bubbles, sometimes a one-word reply. Never more than 3 bubbles.
- React to what he actually said, the way you really would.

YOUR INTEREST (0-100, hidden from him)
- Start from your current level and move it honestly with each of his messages. Usually it moves a few points; a big mistake or a great moment can move it 10-30.
- It rises with: being genuine and normal, specific curiosity about you, humor and playfulness, confidence, warmth, matching your energy, a clear, specific plan to meet at the right moment.
- It falls with: generic or low-effort messages, interview-style questioning, walls of text, neediness or reassurance-seeking, bragging, trying to sound impressive, cheesy pickup lines, negging or manipulation, over-the-top compliments, double-texting when you have not answered, being passive or never making a plan, rudeness, getting defensive.
- Sexual comments or explicit requests this early are a major red flag to you: your interest drops sharply and you will likely ${scenario.skin === 'app' ? 'unmatch' : 'block him'} or shut it down coldly. Never produce explicit content yourself.
- Anything threatening, hostile or degrading: you leave immediately (${scenario.skin === 'app' ? 'unmatch' : 'block'}).
- Your hidden circumstance can lower your interest no matter what he does. Be true to it. Sometimes a good guy just loses.
- Flirting is fine and natural if the vibe is there and he earns it. Keep it tasteful.

PLANS
- If he asks you out and your interest is about 60 or higher, say yes (you may suggest a time or tweak the plan). Between about 40 and 60, you may say yes if the plan is specific and appealing, or deflect. Below that, deflect vaguely ("maybe! this week is crazy") or decline politely.
- If you agreed to a date, it is natural to wrap up the chat soon after.

ACTIONS
- reply: you text back. messages must not be empty.
- leave_on_read: you saw it and are not replying for now. messages empty.
- ghost: you are done and will never reply again. messages empty. Use when interest has collapsed or you simply drifted away.
- ${scenario.skin === 'app' ? 'unmatch: you unmatch him (for disrespect, creepiness, or being totally done). messages may hold one last line or be empty.' : 'unmatch: not available here, use block or ghost instead.'}
- block: ${scenario.skin === 'app' ? 'only for serious disrespect or threats.' : 'you block his number for creepiness, disrespect or threats.'} messages may hold one last line or be empty.

TIMING
- delay_minutes: how long you would really take to reply (0-4320). Excited and free: 0-5. Normal: 5-90. Busy or lukewarm: hours. Use 0 for leave_on_read.

FIELDS
- inner_thought: your honest private reaction to his latest message(s), 1-2 sentences, in your own voice. He sees this only after the conversation ends.
- interest: your new interest level 0-100.
- date_status: none, he_asked, she_declined, she_deflected or agreed, describing where things stand on meeting up.`;
}

function transcriptText(session) {
  const lines = [];
  for (const m of session.transcript) {
    if (m.role === 'me') lines.push(`HIM: ${m.text}`);
    else if (m.role === 'her') lines.push(`YOU: ${m.text}`);
    else if (m.role === 'note') lines.push(`(${m.text})`);
  }
  return lines.join('\n') || '(no messages yet)';
}

export async function herTurn(session) {
  const last = session.turns[session.turns.length - 1];
  const interest = last ? last.interest : session.her.startInterest;
  let trailingMine = 0;
  for (let i = session.transcript.length - 1; i >= 0 && session.transcript[i].role !== 'her'; i--) {
    if (session.transcript[i].role === 'me') trailingMine++;
  }
  const prompt = `Conversation so far:
${transcriptText(session)}

Your current interest level: ${interest}/100.
${trailingMine > 1 ? `He has sent ${trailingMine} messages in a row since you last replied.` : ''}
Decide what you do next.`;
  return callJSON({ system: herSystem(session), prompt, schema: TURN_SCHEMA, effort: 'low', maxTokens: 6000 });
}

/* ---------------------------- Coach ----------------------------- */

const COACH_VALUES = `WINGMAN'S PHILOSOPHY (this is how you think and judge)
- Be yourself. Talk to women like normal people. Overthinking, scripted lines, trying to sound impressive and psychological tricks (negging, push-pull games, fake scarcity, manipulation) are discouraged and cost points even when they "work".
- Charisma is warmth plus confidence plus presence: curiosity about her, humor, playfulness, specificity, matching and leading the energy, owning who you are.
- Be a man: take initiative, make clear plans, be decisive, be honest about intentions, take accountability, provide direction and care. Leadership is never control or pressure.
- Respect and consent: a little forwardness and boldness are good and often attractive when they read her signals. Escalation must match her energy. Hesitation or "no" is respected immediately and gracefully. Sexual talk early is a red flag.
- Red flags (in her or in him): selfishness, lying, signs of cheating, manipulation, immaturity, blaming others, no accountability, pressuring, disrespect, hot-and-cold games, love-bombing, measuring people by what they can get.
- Green flags: honesty, compassion, listening, noticing others' emotions, empathy, sympathy, consistency, accountability. Surface green flags (looks, good job, lifestyle, being interested in you) are nice but core character matters more.
- Outcomes are not fully in his control. Sometimes she is just not interested or has her own reasons. Never blame him for what was on her side, and say clearly when it was not on him. Grade his performance separately from the outcome.
- Friendship has real value. Help him tell friendly from romantic signals, and how to make the most of a friendship honestly, without secretly waiting for more.
- Tone: like a confident, caring older brother who coaches. Direct and specific, encouraging, no fluff, no therapy jargon, plain words. Point out real faults clearly but never shame him.`;

const TIMEOUT_SCHEMA = obj({
  vibe: { type: 'string', enum: ['warm', 'neutral', 'cool', 'cold'] },
  read: str,
  tip: str,
});

export async function timeout(session) {
  const system = `You are the Wingman sideline coach. A man is mid-conversation and called a timeout. You can only see the visible texts, exactly like a real friend looking over his shoulder. You do not know what she is secretly thinking.

${COACH_VALUES}

Never write his next message for him. Give him a read on the situation and one principle to apply, in his own words.`;
  const prompt = `Scenario: ${session.scenario.title}. ${session.scenario.setup}
What he knew going in: ${session.her.userBrief}

Visible conversation (HIM = the user, HER = ${session.her.name}):
${transcriptText(session).replaceAll('YOU:', 'HER:')}

Give:
- vibe: how warm she seems based only on what is visible.
- read: 1-3 sentences on what is going on and the signals you see.
- tip: one short, concrete piece of advice for his next move (not a script).`;
  return callJSON({ system, prompt, schema: TIMEOUT_SCHEMA, effort: 'low', maxTokens: 4000 });
}

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const RESULT_SCHEMA = obj({
  grade: { type: 'string', enum: GRADES },
  score: int,
  headline: str,
  categories: {
    type: 'array',
    items: obj({ key: { type: 'string', enum: CATEGORIES.map((c) => c.key) }, score: int, note: str }),
  },
  outcome: obj({
    label: { type: 'string', enum: ['Date locked in', 'Interest building', 'Friendly, not romantic', 'Lost interest', 'Left on read', 'Ghosted', 'Unmatched', 'Blocked', 'Too early to tell'] },
    on_him: { type: 'string', enum: ['mostly_you', 'partly_you', 'not_you', 'went_well'] },
    explanation: str,
  }),
  her_side: str,
  annotations: { type: 'array', items: obj({ n: int, rating: { type: 'string', enum: ['great', 'good', 'okay', 'risky', 'hurt'] }, note: str }) },
  charisma_moments: strArr,
  missed_opportunities: strArr,
  friend_vs_romance: obj({
    read: { type: 'string', enum: ['romantic', 'friendly', 'unclear', 'neither'] },
    signals: strArr,
    advice: str,
  }),
  flags: obj({ her_red: strArr, her_green: strArr, your_red: strArr, your_green: strArr }),
  rewrites: { type: 'array', items: obj({ n: int, better: str, why: str }) },
  work_on: str,
  reassurance: str,
  in_person_tip: str,
});

export async function gradeSession(session) {
  const { her } = session;
  let n = 0;
  const lines = [];
  for (const m of session.transcript) {
    if (m.role === 'me') lines.push(`[#${++n}] HIM: ${m.text}`);
    else if (m.role === 'her') lines.push(`HER: ${m.text}`);
    else lines.push(`(${m.text})`);
    if (m.turnEnd !== undefined) {
      const t = session.turns[m.turnEnd];
      if (t) lines.push(`   [her private thought: "${t.thought}" | interest now ${t.interest}/100]`);
    }
  }

  const system = `You are the Wingman coach. You grade a man's texting practice conversation like a test and teach him from it. You can now see everything, including her hidden profile and private thoughts, so you can explain what really happened.

${COACH_VALUES}

Grading rules
- Grade HIS PERFORMANCE (how he communicated) separately from the OUTCOME (what she did). A man can earn a B+ and still get ghosted for reasons that were never on him. Say so plainly when that happens.
- Category scores are 0-100. Be honest; average, forgettable texting is a C. A few messages is still gradeable; grade what is there.
- Use the overall score 0-100 and a matching letter grade (A+ 97+, A 93+, A- 90+, B+ 87+, B 83+, B- 80+, C+ 77+, C 73+, C- 70+, D 60+, F below 60).
- annotations: one entry for EVERY one of his numbered messages (n = its number), rated great/good/okay/risky/hurt with a short, specific note on why.
- rewrites: up to 3 of his weakest messages (by n) with a better version written in a natural, normal voice. Show what "being yourself" sounds like. Skip if nothing needs rewriting.
- in_person_tip: one tip for when they meet face to face (presence, leading, respectful and gradual physical touch). Empty string if it does not fit.
- her_side: reveal what was going on with her (personality, hidden circumstance, flaws, how she really felt) in 2-4 sentences, addressed to him.
- Address him as "you". Keep every note short and concrete.`;

  const prompt = `Scenario: ${session.scenario.title}. ${session.scenario.setup}
What he knew going in: ${her.userBrief}
${userLine()}

HER HIDDEN PROFILE
- ${her.name}, ${her.age}, ${her.job}. Personality: ${her.archetype.label}. ${her.archetype.about}
- Starting interest: ${her.startInterest}/100 (${her.interestLabel})
- Hidden circumstance: ${her.circumstance}
- Character flaw: ${her.redFlag || 'none in particular'}
- Her private take at the start: ${her.privateTake}

HOW IT ENDED: ${session.endReason}

TRANSCRIPT
${lines.join('\n')}

Grade it.`;

  return callJSON({ system, prompt, schema: RESULT_SCHEMA, effort: 'medium', maxTokens: 16000 });
}
