const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async initialize(password = null) {
    try {
      const dataDir = path.join(os.homedir(), 'TypeWriter');
      await fs.promises.mkdir(dataDir, { recursive: true });
      
      this.dbPath = path.join(dataDir, 'notes.db');
      console.log('Database path:', this.dbPath);
      
      // Create database instance
      this.db = new Database(this.dbPath);
      console.log('Database instance created successfully');
      
      if (password) {
        this.db.pragma(`key = '${password}'`);
      }
      
      // Performance optimizations
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('foreign_keys = ON');
      
      console.log('Database pragmas set');
      
      this.createTables();
      console.log('Database tables created');
      
      return { success: true };
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = null; // Ensure db is null on failure
      throw error;
    }
  }

  createTables() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const schema = `
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_open BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notes_section_id ON notes(section_id);
      CREATE INDEX IF NOT EXISTS idx_notes_last_edited ON notes(last_edited);
    `;

    this.db.exec(schema);
  }

  // Add database check method
  checkDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  // Section operations
  getAllSections() {
    this.checkDatabase();
    
    const stmt = this.db.prepare(`
      SELECT s.*, 
             COUNT(n.id) as notes_count
      FROM sections s
      LEFT JOIN notes n ON s.id = n.section_id
      GROUP BY s.id
      ORDER BY s.created_at
    `);
    return stmt.all();
  }

  createSection(id, name) {
    this.checkDatabase();
    
    const stmt = this.db.prepare(`
      INSERT INTO sections (id, name) VALUES (?, ?)
    `);
    return stmt.run(id, name);
  }

  updateSection(id, updates) {
    this.checkDatabase();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`
      UPDATE sections SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  deleteSection(id) {
    this.checkDatabase();
    
    const stmt = this.db.prepare('DELETE FROM sections WHERE id = ?');
    return stmt.run(id);
  }

  // Note operations
  getNotesBySection(sectionId) {
    this.checkDatabase();
    
    const stmt = this.db.prepare(`
      SELECT * FROM notes 
      WHERE section_id = ? 
      ORDER BY last_edited DESC
    `);
    return stmt.all(sectionId);
  }

  getNote(id) {
    this.checkDatabase();
    
    const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
    return stmt.get(id);
  }

  createNote(id, sectionId, title, content = '') {
    this.checkDatabase();
    
    const stmt = this.db.prepare(`
      INSERT INTO notes (id, section_id, title, content) VALUES (?, ?, ?, ?)
    `);
    return stmt.run(id, sectionId, title, content);
  }

  updateNote(id, updates) {
    this.checkDatabase();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`
      UPDATE notes SET ${fields}, last_edited = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  deleteNote(id) {
    this.checkDatabase();
    
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    return stmt.run(id);
  }

  // Get all data in the format expected by your React component
  getAllData() {
    this.checkDatabase();
    
    const sections = this.getAllSections();
    return sections.map(section => ({
      id: section.id,
      name: section.name,
      isOpen: Boolean(section.is_open),
      notes: this.getNotesBySection(section.id).map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        lastEdited: new Date(note.last_edited)
      }))
    }));
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DatabaseManager;