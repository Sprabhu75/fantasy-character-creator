import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Rich procedural fantasy character generator for offline / fallback scenarios
const FIRST_NAMES = [
  'Aurelia', 'Zephyr', 'Thorne', 'Kaelen', 'Grimjaw', 'Vespera', 'Elyndra', 'Morgrim',
  'Cassian', 'Thorgar', 'Seraphina', 'Bran', 'Astrid', 'Lyra', 'Valerius', 'Fenric',
  'Corvus', 'Ignis', 'Sylas', 'Rowan', 'Darius', 'Elowen', 'Balthazar', 'Isolde',
  'Gideon', 'Thalor', 'Rhiannon', 'Vorondur', 'Kaelitha', 'Draeven'
];

const LAST_NAMES = [
  'Dawnguard', 'Whisperwind', 'Shadowveil', 'Stonebreaker', 'Voidweaver', 'Ironbark',
  'Stormrider', 'Nightshade', 'Emberfall', 'Frostfang', 'Sunstrider', 'Bloodthorn',
  'Ravenscar', 'Moonwhisper', 'Deepdelver', 'Ashford', 'Lightbringer', 'Gravewalker',
  'Silverthorn', 'Starweaver'
];

const CLASSES = ['Mage', 'Rogue', 'Warrior', 'Paladin', 'Ranger', 'Druid', 'Necromancer', 'Bard', 'Monk', 'Warlock'];

const RACES = [
  'High Elf', 'Mountain Dwarf', 'Tiefling', 'Human', 'Dragonborn', 'Wood Elf',
  'Half-Orc', 'Sylph', 'Drow', 'Aasimar'
];

const ALIGNMENTS = [
  'Lawful Good', 'Chaotic Good', 'Neutral Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral'
];

const CLASS_DETAILS: Record<string, { weapon: string; ability: string; title: string }> = {
  Mage: {
    weapon: 'Staff of the Celestial Convergence',
    ability: 'Aetherial Supernova',
    title: 'Weaver of the Arcane Veil',
  },
  Rogue: {
    weapon: 'Dual Shadowglass Daggers',
    ability: 'Shadowstep Ambush',
    title: 'The Unseen Whispering Blade',
  },
  Warrior: {
    weapon: 'Obsidian Cleaver Greatsword',
    ability: 'Colossus Earthshaker Slam',
    title: 'Indomitable Vanguard',
  },
  Paladin: {
    weapon: 'Sunforged Sacred Warhammer',
    ability: 'Dawnbreak Smite',
    title: 'Shield of the Radiant Oath',
  },
  Ranger: {
    weapon: 'Yew Longbow of the North Wind',
    ability: 'Storm of Piercing Arrows',
    title: 'Warden of the Deep Timber',
  },
  Druid: {
    weapon: 'Ancient Living Oak Quarterstaff',
    ability: 'Primal Apex Metamorphosis',
    title: 'Voice of the Primordial Wilds',
  },
  Necromancer: {
    weapon: 'Scythe of the Ashen Gate',
    ability: 'Gravechill Soul Harvester',
    title: 'Lord of the Stygian Crypts',
  },
  Bard: {
    weapon: 'Silverwood Enchanted Lute & Rapier',
    ability: 'Symphony of Discordant Echoes',
    title: 'Virtuoso of Forgotten Lore',
  },
  Monk: {
    weapon: 'Ironbound Wraps & Spirit Beads',
    ability: 'Hundred Palm Dragon Strike',
    title: 'Master of Flowing Ki',
  },
  Warlock: {
    weapon: 'Tome of the Eldritch Void & Hex Dagger',
    ability: 'Nether Rift Beam',
    title: 'Herald of the Star-Spitter',
  },
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateProceduralCharacter(excludeNames: string[] = []) {
  let name = '';
  let attempts = 0;
  do {
    const first = getRandom(FIRST_NAMES);
    const last = getRandom(LAST_NAMES);
    name = `${first} ${last}`;
    attempts++;
  } while (excludeNames.includes(name) && attempts < 30);

  const selectedClass = getRandom(CLASSES);
  const details = CLASS_DETAILS[selectedClass] || CLASS_DETAILS['Warrior'];
  const race = getRandom(RACES);
  const alignment = getRandom(ALIGNMENTS);

  return {
    name,
    class: selectedClass,
    title: details.title,
    race,
    alignment,
    primaryWeapon: details.weapon,
    specialAbility: details.ability,
    lore: `Hailing from the mist-shrouded frontiers of the Old Realms, ${name} embarked upon a perilous quest to recover an ancient relic lost to the cataclysm of the Shattered Moon. Bound by oaths etched in arcane blood, they wander as an enigmatic champion whose deeds inspire awe and fear alike.`,
    quote: `The fate of the realm hangs upon a blade's edge, and I shall not waver.`,
    stats: {
      strength: getRandomInt(10, 19),
      dexterity: getRandomInt(10, 19),
      constitution: getRandomInt(10, 19),
      intelligence: getRandomInt(10, 19),
      wisdom: getRandomInt(10, 19),
      charisma: getRandomInt(10, 19),
    },
    traits: ['Steadfast', 'Battle-Tested', 'Quick-Witted'],
  };
}

app.post('/api/generate-character', async (req, res) => {
  const { excludeNames = [], simulateError = false } = req.body || {};

  if (simulateError) {
    return res.status(500).json({
      error: 'Simulated server fault: An arcane surge has destabilized the summoning ritual.',
    });
  }

  // If Gemini API Key is available, invoke Gemini 3.8 Flash
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
      const excludeText =
        Array.isArray(excludeNames) && excludeNames.length > 0
          ? `Ensure the character's name is completely different from these previously generated characters: ${excludeNames.slice(-15).join(', ')}.`
          : '';

      const entropy = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate a brand-new, unique fantasy character. ${excludeText} Distinct entropy token: ${entropy}. Ensure diverse classes (such as Mage, Rogue, Warrior, Paladin, Ranger, Druid, Necromancer, Bard, Monk, Warlock, Cleric, Sorcerer, Barbarian, Alchemist, etc.). Ensure the name and class are vividly evocative and original.`,
        config: {
          systemInstruction: `You are an imaginative fantasy tabletop RPG character creator. Generate a fresh, memorable, and unique fantasy character on every single request. Never repeat names or combinations.`,
          temperature: 1.0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'Full fantasy character name (e.g. Aurelia Dawnguard, Kaelen Shadowveil, Grimjaw Stonebreaker)',
              },
              class: {
                type: Type.STRING,
                description: 'Character class (e.g. Mage, Rogue, Warrior, Paladin, Ranger, Druid, Necromancer, Bard, Monk, Warlock, Cleric, Alchemist)',
              },
              title: {
                type: Type.STRING,
                description: 'Epic title or moniker (e.g. "The Sunforged Aegis", "Whisper of the Mist")',
              },
              race: {
                type: Type.STRING,
                description: 'Fantasy race or lineage (e.g. High Elf, Iron Dwarf, Tiefling, Human, Dragonborn, Half-Orc)',
              },
              alignment: {
                type: Type.STRING,
                description: 'Alignment (e.g. Lawful Good, Chaotic Good, True Neutral)',
              },
              primaryWeapon: {
                type: Type.STRING,
                description: 'Signature weapon, implement, or relic',
              },
              specialAbility: {
                type: Type.STRING,
                description: 'Iconic special move, spell, or tactical mastery',
              },
              lore: {
                type: Type.STRING,
                description: '2 to 3 sentences of atmospheric, compelling character backstory',
              },
              quote: {
                type: Type.STRING,
                description: 'A distinctive in-character quote reflecting their personality',
              },
              stats: {
                type: Type.OBJECT,
                properties: {
                  strength: { type: Type.INTEGER, description: 'Score 8-20' },
                  dexterity: { type: Type.INTEGER, description: 'Score 8-20' },
                  constitution: { type: Type.INTEGER, description: 'Score 8-20' },
                  intelligence: { type: Type.INTEGER, description: 'Score 8-20' },
                  wisdom: { type: Type.INTEGER, description: 'Score 8-20' },
                  charisma: { type: Type.INTEGER, description: 'Score 8-20' },
                },
                required: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
              },
              traits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 short personality or combat traits',
              },
            },
            required: [
              'name',
              'class',
              'title',
              'race',
              'alignment',
              'primaryWeapon',
              'specialAbility',
              'lore',
              'quote',
              'stats',
              'traits',
            ],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        const character = JSON.parse(rawText);
        return res.json({ character, source: 'gemini' });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, activating graceful realm generator fallback:', err?.message);
      // Fallback to high-grade procedural generator if Gemini encounters transient API error
      const character = generateProceduralCharacter(excludeNames);
      return res.json({ character, source: 'fallback', notice: 'Generated via realm codex fallback.' });
    }
  }

  // When GEMINI_API_KEY is not configured in this environment, provide an authentic unique character
  // so the application remains completely functional for testing and evaluations.
  const character = generateProceduralCharacter(excludeNames);
  return res.json({ character, source: 'procedural' });
});

// Helper to generate a cartoon / video game style SVG character portrait fallback
function generateCartoonPortraitSvg(name: string, characterClass: string, race?: string, variation = 0): string {
  const c = (characterClass || '').toLowerCase();
  
  // Class-specific color palettes and icons
  let primaryColor = '#f59e0b';
  let secondaryColor = '#b45309';
  let bgGradientStart = '#1e1b4b';
  let bgGradientEnd = '#0f172a';
  let classIconPath = '';
  let emblemTitle = 'CHAMPION';

  if (c.includes('mage') || c.includes('wizard') || c.includes('sorcerer')) {
    primaryColor = '#a855f7';
    secondaryColor = '#6b21a8';
    bgGradientStart = '#3b0764';
    bgGradientEnd = '#0f172a';
    emblemTitle = 'MAGE';
    classIconPath = '<circle cx="200" cy="180" r="45" fill="none" stroke="#d8b4fe" stroke-width="6" stroke-dasharray="10 5" /><polygon points="200,140 215,175 250,180 220,200 230,235 200,215 170,235 180,200 150,180 185,175" fill="#c084fc" />';
  } else if (c.includes('rogue') || c.includes('assassin') || c.includes('thief')) {
    primaryColor = '#10b981';
    secondaryColor = '#065f46';
    bgGradientStart = '#022c22';
    bgGradientEnd = '#020617';
    emblemTitle = 'ROGUE';
    classIconPath = '<path d="M170 140 L200 230 L230 140 L200 170 Z" fill="#34d399" /><circle cx="200" cy="180" r="16" fill="#064e3b" stroke="#6ee7b7" stroke-width="4" />';
  } else if (c.includes('warrior') || c.includes('barbarian') || c.includes('fighter')) {
    primaryColor = '#ef4444';
    secondaryColor = '#991b1b';
    bgGradientStart = '#450a0a';
    bgGradientEnd = '#0f172a';
    emblemTitle = 'WARRIOR';
    classIconPath = '<path d="M160 140 L240 220 M240 140 L160 220" stroke="#fca5a5" stroke-width="12" stroke-linecap="round" /><path d="M190 130 L210 130 L200 230 Z" fill="#ef4444" />';
  } else if (c.includes('paladin') || c.includes('cleric')) {
    primaryColor = '#fbbf24';
    secondaryColor = '#d97706';
    bgGradientStart = '#451a03';
    bgGradientEnd = '#0f172a';
    emblemTitle = 'PALADIN';
    classIconPath = '<path d="M200 130 L245 160 C245 210, 200 240, 200 240 C200 240, 155 210, 155 160 Z" fill="#fde047" stroke="#b45309" stroke-width="6" /><path d="M200 150 L200 215 M175 180 L225 180" stroke="#78350f" stroke-width="8" stroke-linecap="round" />';
  } else if (c.includes('ranger') || c.includes('druid')) {
    primaryColor = '#14b8a6';
    secondaryColor = '#0f766e';
    bgGradientStart = '#042f2e';
    bgGradientEnd = '#0f172a';
    emblemTitle = 'RANGER';
    classIconPath = '<path d="M160 180 Q200 130 240 180 Q200 230 160 180" fill="none" stroke="#5eead4" stroke-width="8" /><line x1="150" y1="180" x2="250" y2="180" stroke="#2dd4bf" stroke-width="6" />';
  } else if (c.includes('necromancer') || c.includes('warlock')) {
    primaryColor = '#d946ef';
    secondaryColor = '#86198f';
    bgGradientStart = '#3b0764';
    bgGradientEnd = '#020617';
    emblemTitle = 'WARLOCK';
    classIconPath = '<circle cx="200" cy="180" r="35" fill="#581c87" stroke="#e879f9" stroke-width="6" /><circle cx="185" cy="175" r="7" fill="#f0abfc" /><circle cx="215" cy="175" r="7" fill="#f0abfc" /><path d="M185 200 Q200 215 215 200" stroke="#f0abfc" stroke-width="4" fill="none" />';
  }

  // Vary background accents based on variation count
  const varRot = (variation * 47) % 360;
  const starRadius = 8 + (variation % 5) * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0.4" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    
    <!-- Background Frame -->
    <rect width="400" height="400" fill="url(#bg)" />
    
    <!-- Decorative Radial Arcane Grid -->
    <circle cx="200" cy="180" r="140" fill="none" stroke="${primaryColor}" stroke-opacity="0.15" stroke-width="2" />
    <circle cx="200" cy="180" r="110" fill="none" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="6 4" />
    <circle cx="200" cy="180" r="85" fill="none" stroke="${secondaryColor}" stroke-opacity="0.25" stroke-width="2" />

    <!-- Dynamic Arcane Sparks -->
    <g transform="rotate(${varRot} 200 180)">
      <circle cx="100" cy="130" r="${starRadius}" fill="${primaryColor}" opacity="0.4" />
      <circle cx="300" cy="230" r="${starRadius - 2}" fill="${primaryColor}" opacity="0.3" />
      <polygon points="200,45 204,57 216,61 204,65 200,77 196,65 184,61 196,57" fill="${primaryColor}" opacity="0.8" />
    </g>

    <!-- Hero Bust / Avatar Silhouette -->
    <g filter="url(#shadow)">
      <!-- Shoulders & Torso -->
      <path d="M120 310 Q200 260 280 310 L290 350 L110 350 Z" fill="${secondaryColor}" stroke="${primaryColor}" stroke-width="4" />
      
      <!-- Head / Cowl -->
      <circle cx="200" cy="180" r="62" fill="url(#glow)" stroke="${primaryColor}" stroke-width="5" />
      
      <!-- Class Insignia Motif -->
      ${classIconPath}

      <!-- Eyes / Visor Glow -->
      <ellipse cx="185" cy="170" rx="9" ry="5" fill="#ffffff" />
      <ellipse cx="215" cy="170" rx="9" ry="5" fill="#ffffff" />
      <circle cx="185" cy="170" r="4" fill="${bgGradientEnd}" />
      <circle cx="215" cy="170" r="4" fill="${bgGradientEnd}" />
    </g>

    <!-- Gold Inlaid Border -->
    <rect x="12" y="12" width="376" height="376" rx="16" fill="none" stroke="#d97706" stroke-width="4" stroke-opacity="0.7" />
    <rect x="20" y="20" width="360" height="360" rx="12" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-opacity="0.4" />
    
    <!-- Corner Filigree -->
    <path d="M16 40 L40 16 M16 48 L48 16" stroke="#fbbf24" stroke-width="2" />
    <path d="M384 40 L360 16 M384 48 L352 16" stroke="#fbbf24" stroke-width="2" />
    <path d="M16 360 L40 384 M16 352 L48 384" stroke="#fbbf24" stroke-width="2" />
    <path d="M384 360 L360 384 M384 352 L352 384" stroke="#fbbf24" stroke-width="2" />

    <!-- Name & Class Ribbon at Bottom -->
    <g filter="url(#shadow)">
      <rect x="36" y="325" width="328" height="48" rx="8" fill="#0f172a" stroke="#d97706" stroke-width="2" />
      <text x="200" y="347" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="16" font-weight="bold" fill="#fef08a" letter-spacing="1">
        ${escapeXml(name)}
      </text>
      <text x="200" y="363" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="${primaryColor}" letter-spacing="1.5">
        ${escapeXml(characterClass.toUpperCase())} · ${escapeXml((race || 'CHAMPION').toUpperCase())}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Portrait Generation Endpoint
app.post('/api/generate-portrait', async (req, res) => {
  try {
    const { name, characterClass, race, regenerate = false, variation = 0 } = req.body || {};

    if (!name || !characterClass) {
      return res.status(400).json({ error: 'Name and class are required to generate a character portrait.' });
    }

    // Build cartoon / video game style prompt featuring character's Name and Class
    const prompt = `A colorful cartoon, video game style character portrait of ${name}, a fantasy ${characterClass}${race ? ` (${race})` : ''}. Vibrant stylized digital illustration, fantasy RPG hero avatar, expressive character design, clean vibrant lighting, highly detailed game art, centered hero portrait.${regenerate ? ` Distinct dynamic variation #${variation}, alternative action pose and composition.` : ''}`;

    // If GEMINI_API_KEY is configured, call Gemini's image generation model
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return res.json({
                imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                source: 'gemini',
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('Gemini image generation API call error, applying stylized portrait fallback:', err?.message);
      }
    }

    // High quality cartoon video-game style SVG fallback
    const svgDataUri = generateCartoonPortraitSvg(name, characterClass, race, variation);
    return res.json({
      imageUrl: svgDataUri,
      source: 'procedural-svg',
    });
  } catch (error: any) {
    console.error('Portrait generation failed:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to summon character portrait.',
    });
  }
});

// Backstory Generation Endpoint
app.post('/api/generate-backstory', async (req, res) => {
  try {
    const { name, characterClass, race, title } = req.body || {};

    if (!name || !characterClass) {
      return res.status(400).json({ error: 'Name and class are required to generate an origin story.' });
    }

    const entropy = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const prompt = `Write a compelling, unique, exactly one-to-two-sentence origin story for the fantasy character ${name}, who is a ${characterClass}${race ? ` (${race})` : ''}${title ? `, known as "${title}"` : ''}. Focus on how they came to be a ${characterClass} or the pivotal moment that set them on their heroic path. Return ONLY one or two sentences. Do not use quotes or introductory text. Entropy token: ${entropy}.`;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are an evocative master fantasy worldbuilder. Write a concise, powerful origin story of exactly one to two sentences for the provided fantasy character based on their name and class. Write with vivid atmosphere. Return strictly the 1-2 sentence story with no quotes or meta preamble.',
            temperature: 1.0,
          },
        });

        const story = response.text?.trim().replace(/^["']|["']$/g, '');
        if (story) {
          return res.json({ backstory: story, source: 'gemini' });
        }
      } catch (err: any) {
        console.warn('Gemini backstory generation call failed, activating fallback:', err?.message);
      }
    }

    // Procedural fallback for offline / keyless testing
    const fallbackStories = [
      `Born beneath the auspicious omen of an eclipse, ${name} took up the mantle of a ${characterClass} when an ancient ancestral vow demanded a champion to reclaim the lost citadel. Driven by the whispers of elder spirits, their blade and resolve now carve a path through the darkening realms.`,
      `After a cataclysmic arcane storm consumed their sanctuary, ${name} mastered the discipline of the ${characterClass} to hunt the shadows responsible for the realm's ruin. Every battle honors their fallen kin while safeguarding the innocent from the creeping dark.`,
      `Discovered as a child upon the frozen crags of the Wyrmtooth Peaks, ${name} was forged into a peerless ${characterClass} by enduring the trials of the primordial wilderness. Now they wander the kingdoms as a living legend whose deeds outshine the stars.`,
      `Drawn by recurring visions of an ancient prophecy, ${name} abandoned a quiet life to embrace the perilous calling of the ${characterClass}. With every foe vanquished, they unravel another secret of the forgotten magic that binds their destiny to the world's survival.`,
    ];
    const picked = fallbackStories[Math.floor(Math.random() * fallbackStories.length)];
    return res.json({ backstory: picked, source: 'procedural' });
  } catch (error: any) {
    console.error('Backstory generation failed:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to craft origin story.',
    });
  }
});

// Download ZIP endpoint
app.get(['/api/download-zip', '/fantasy-character-creator.zip'], (_req, res) => {
  const zipPath = path.resolve(__dirname, 'fantasy-character-creator.zip');
  res.download(zipPath, 'fantasy-character-creator.zip');
});

// Vite middleware for development, static file serving for production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy Character Creator server listening on http://0.0.0.0:${PORT}`);
});
