/* ======================================================================
   YOUR WIKI CONTENT — EDIT THIS FILE FIRST
   No publishing tools or database required to edit the wiki.
   TEMPLATE blocks below are the single source for each kind of entry.
   Duplicate an object, give it a unique id, and change the text.
   All body strings are plain text, not HTML. Paragraphs are array items.
   ====================================================================== */

const WIKI = {
  // TEMPLATE: SITE IDENTITY. PPP is the folder label, not an assumed game name.
  identity: { name: "PPP", title: "Game wiki", stage: "Early development" },

  // TEMPLATE: NAVIGATION ITEM. Keep the id unique; it becomes the URL hash.
  navigation: [
    { id: "home", label: "Home", icon: "home", group: "archive" },
    { id: "lore", label: "Lore & world", icon: "book", group: "archive" },
    { id: "mechanics", label: "Mechanics", icon: "gear", group: "archive" },
    { id: "guides", label: "Getting started", icon: "flag", group: "archive" },
    { id: "devblog", label: "Dev journal", icon: "pen", group: "development" },
    { id: "state", label: "Game state", icon: "list", group: "development" },
    { id: "author", label: "About the author", icon: "person", group: "development" }
  ],

  // TEMPLATE: PAGE HEADER. The same layout is shared by all inner pages.
  pages: {
    lore: { label: "01 / THE WORLD", title: "Lore & world", intro: "The setting, the history, and the places along the way." },
    mechanics: { label: "02 / THE SYSTEMS", title: "How the game works", intro: "Survival, investigation, and a community on the move. These are design concepts, not a list of finished features." },
    guides: { label: "03 / THE FIRST STEPS", title: "Getting started", intro: "A place for controls, walkthroughs, and everything a new player needs." },
    devblog: { label: "04 / BEHIND THE SCENES", title: "Dev journal", intro: "Ideas, experiments, and notes from the author." },
    state: { label: "05 / WORK IN PROGRESS", title: "Game state", intro: "A development checklist. Statuses are maintained in the wiki’s code." },
    author: { label: "06 / THE PERSON BEHIND IT", title: "About the author", intro: "The person building this little world." }
  },

  home: {
    heading: ["A WORLD", "IN THE MAKING."],
    summary: "A 2D pixel-art game about survival, investigation, and building a community aboard a mobile base.",
    note: "The game is still in its early stages. This archive will grow alongside it.",
    // Decorative reference values only — not a live connection to Godot.
    displayYear: "00000", displayDay: "041"
  },

  // TEMPLATE: LORE ARTICLE. Replace placeholders with your own canon.
  lore: [
    { id: "setting", title: "The setting", icon: "world", status: "UNWRITTEN", summary: "The world before the journey begins.", body: ["[Write the setting of your game here.]", "[Describe the world, its atmosphere, and what the player knows at the beginning.]"] },
    { id: "history", title: "What happened", icon: "book", status: "UNWRITTEN", summary: "The events that shaped the world.", body: ["[Write what happened to the world here.]", "[Add your timeline or key events. No cause of the apocalypse has been assumed.]"] }
  ],

  // TEMPLATE: BIOME CARD. Add an image path later if desired; names are placeholders.
  biomes: [
    { id: "biome-1", title: "BIOME 1", icon: "world", status: "PLACEHOLDER", summary: "Location details to be written.", body: ["[Replace BIOME 1 with your biome’s name.]", "[Describe its environment, available resources, and encounters when implemented.]"] },
    { id: "biome-2", title: "BIOME 2", icon: "world", status: "PLACEHOLDER", summary: "Location details to be written.", body: ["[Replace BIOME 2 with your biome’s name.]", "[Add this biome’s details here.]"] },
    { id: "biome-3", title: "BIOME 3", icon: "world", status: "PLACEHOLDER", summary: "Location details to be written.", body: ["[Replace BIOME 3 with your biome’s name.]", "[Add this biome’s details here.]"] }
  ],

  // TEMPLATE: MECHANIC CARD. Context comes from earlier chats; completion is unverified.
  mechanics: [
    { id: "movement", title: "Movement & animation", icon: "person", status: "PROTOTYPE", summary: "A character controller with directional movement and animations.", body: ["Your earlier Godot discussions cover player movement, collisions, and directional idle and walking animations.", "[Add your final controls and behaviour here.]"] },
    { id: "day-system", title: "Days & sleeping", icon: "clock", status: "IN DEVELOPMENT", summary: "A day/year display and bed interaction.", body: ["Your Godot Bed Day Tracking chat discusses advancing the day through bed interaction and updating the year/day HUD through GameState.", "[Document the final calendar rules once verified in the game.]"] },
    { id: "mobile-base", title: "The mobile base", icon: "base", status: "DESIGN CONCEPT", summary: "A travelling home for the player and their community.", body: ["The design described in earlier chats uses a mobile base as a home, a means of travel, and a place to manage the community.", "[Describe implemented rooms, capacity, and upgrades here.]"] },
    { id: "investigation", title: "Investigation", icon: "search", status: "DESIGN CONCEPT", summary: "Learn about strangers before deciding who to trust.", body: ["The concept involves learning about NPCs through conversations, observation, clues, and hidden traits.", "[Add the actual investigation rules here once implemented.]"] },
    { id: "community", title: "Community", icon: "people", status: "DESIGN CONCEPT", summary: "Recruitment, relationships, and the consequences of decisions.", body: ["Earlier design discussions describe accepting or rejecting potential community members and managing NPC relationships.", "[Add recruitment conditions and relationship systems here.]"] },
    { id: "resources", title: "Survival & resources", icon: "box", status: "DESIGN CONCEPT", summary: "Manage supplies as the community and journey develop.", body: ["Resource management and exploration are part of the game concept discussed in your earlier chats.", "[Name resources and document their rules only after you decide or implement them.]"] }
  ],

  // TEMPLATE: TUTORIAL. Each step is a plain-text string, rendered as a numbered list.
  guides: [
    { id: "guide-1", title: "TUTORIAL 1", icon: "flag", status: "UNWRITTEN", summary: "Your first tutorial goes here.", body: ["[Rename this entry and write an introduction.]"], steps: ["[Write the first step.]", "[Write the second step.]", "[Write the third step.]"] },
    { id: "guide-2", title: "TUTORIAL 2", icon: "gear", status: "UNWRITTEN", summary: "A place for controls or another walkthrough.", body: ["[Add your tutorial here.]"], steps: ["[Write the first step.]", "[Write the second step.]"] }
  ],

  // TEMPLATE: DEV BLOG POST. Empty dates are displayed as UNDATED, never invented.
  posts: [
    { id: "initial-idea", title: "The initial idea", date: "", tag: "AUTHOR NOTE", body: ["[Write how the game idea began, what inspired you, and what you want to create.]"] },
    { id: "update-ideas", title: "Ideas for the future", date: "", tag: "IDEAS", body: ["[Write your possible updates and experiments here. These notes do not need to be promises.]"] }
  ],

  // TEMPLATE: READ-ONLY GAME TASK. status: done | progress | planned | unverified.
  // Only 'done' receives a checkmark. Earlier assistant suggestions are not proof
  // of completion: keep tasks unverified until YOU verify them in Godot.
  tasks: [
    { label: "Player movement & collisions", status: "unverified", group: "Foundations" },
    { label: "Directional idle & walk animations", status: "unverified", group: "Foundations" },
    { label: "Pixel UI & year/day display", status: "progress", group: "Foundations" },
    { label: "Bed interaction & day progression", status: "progress", group: "Foundations" },
    { label: "Character customisation", status: "unverified", group: "Foundations" },
    { label: "Object interaction system", status: "unverified", group: "Foundations" },
    { label: "Save & load", status: "unverified", group: "Foundations" },
    { label: "Mobile base", status: "planned", group: "World & community" },
    { label: "Biomes & travel", status: "planned", group: "World & community" },
    { label: "NPC generation & personalities", status: "planned", group: "World & community" },
    { label: "Hidden traits & investigation", status: "planned", group: "World & community" },
    { label: "Recruitment & relationships", status: "planned", group: "World & community" },
    { label: "Inventory & resource management", status: "planned", group: "World & community" },
    { label: "Events & base upgrades", status: "planned", group: "World & community" }
  ],

  // TEMPLATE: AUTHOR PROFILE & CONNECTION. Only add real URLs, never fake links.
  author: {
    name: "AUTHOR NAME", role: "Game developer & pixel artist",
    bio: ["[Write a little about yourself here.]", "[Tell readers why you are making the game and what you enjoy creating.]"],
    connections: [] // Example: { label: "GitHub", url: "https://github.com/YOUR_USERNAME" }
  }
};
