# Database Tables & Columns Reference

All tables and their columns as defined in the schema and migrations.

---

## 1. `users`
| Column         | Type         | Notes                          |
|----------------|--------------|--------------------------------|
| id             | SERIAL       | PRIMARY KEY                    |
| username       | VARCHAR(100) | UNIQUE NOT NULL                |
| password_hash  | TEXT         | NOT NULL                       |
| role           | VARCHAR(20)  | NOT NULL, CHECK: admin, subAdmin, teacher |
| is_active      | BOOLEAN      | DEFAULT TRUE                   |
| created_at     | TIMESTAMP    | DEFAULT NOW()                  |

---

## 2. `teachers`
| Column     | Type          | Notes                    |
|------------|---------------|--------------------------|
| id         | SERIAL        | PRIMARY KEY              |
| user_id    | INT           | UNIQUE, REFERENCES users(id) ON DELETE CASCADE |
| full_name  | VARCHAR(120)  | NOT NULL                 |
| phone      | VARCHAR(50)   | nullable                 |
| created_at | TIMESTAMP     | DEFAULT NOW()            |

---

## 3. `education_levels`
| Column     | Type         | Notes           |
|------------|--------------|-----------------|
| id         | SERIAL       | PRIMARY KEY     |
| name_ar    | VARCHAR(50)  | NOT NULL        |
| name_en    | VARCHAR(50)  | NOT NULL        |
| created_at | TIMESTAMP    | DEFAULT NOW()   |

---

## 4. `subjects`
| Column              | Type          | Notes                                |
|---------------------|---------------|--------------------------------------|
| id                  | SERIAL        | PRIMARY KEY                          |
| name_ar             | VARCHAR(120)  | NOT NULL                             |
| name_en             | VARCHAR(120)  | nullable                             |
| education_level_id  | INT           | REFERENCES education_levels(id), nullable |
| price_per_hour      | DECIMAL(10,2) | NOT NULL                             |
| created_at          | TIMESTAMP     | DEFAULT NOW()                        |

**Special lessons (رياضيات، فيزياء، محاسبة، حاسوب، دروس علاجية، etc.):**  
All special subjects (physics, math, computer science, remedial, etc.) are stored here, each with its own **price_per_hour**. When the teacher submits a lesson and selects **"درس خاص"** and a subject, the cost is **subject.price_per_hour × hours**. Regular lessons (عادي) use the **pricing** table by education level + lesson type instead.

---

## 5. `students`
| Column                 | Type          | Notes                                    |
|------------------------|---------------|------------------------------------------|
| id                     | SERIAL        | PRIMARY KEY                              |
| full_name              | VARCHAR(120)  | NOT NULL, UNIQUE                         |
| parent_contact         | VARCHAR(100)  | nullable                                 |
| education_level_id     | INT           | REFERENCES education_levels(id), nullable |
| class                  | VARCHAR(50)   | nullable (migration)                     |
| created_at             | TIMESTAMP     | DEFAULT NOW()                            |
| deleted_at             | TIMESTAMP     | nullable (soft delete, migration)        |
| deletion_note           | TEXT          | nullable (migration)                     |
| created_by_teacher_id  | INT           | REFERENCES teachers(id), nullable (migration) |

---

## 6. `pricing`
| Column              | Type          | Notes                                    |
|---------------------|---------------|------------------------------------------|
| id                  | SERIAL        | PRIMARY KEY                              |
| education_level_id  | INT           | REFERENCES education_levels(id)          |
| lesson_type         | VARCHAR(20)   | NOT NULL, CHECK: individual, group      |
| price_per_hour       | DECIMAL(10,2) | NOT NULL                                 |
| created_at          | TIMESTAMP     | DEFAULT NOW()                            |
| UNIQUE(education_level_id, lesson_type) | | |

---

## 7. `group_pricing_tiers`
| Column              | Type          | Notes                                          |
|---------------------|---------------|------------------------------------------------|
| id                  | SERIAL        | PRIMARY KEY                                    |
| education_level_id  | INT           | REFERENCES education_levels(id) ON DELETE CASCADE |
| student_count       | INT           | NOT NULL, CHECK >= 2                           |
| total_price         | DECIMAL(10,2) | NOT NULL                                       |
| price_per_student   | DECIMAL(10,2) | nullable                                       |
| created_at          | TIMESTAMP     | DEFAULT NOW()                                  |
| UNIQUE(education_level_id, student_count) | | |

---

## 8. `individual_lessons`
| Column              | Type          | Notes                                    |
|---------------------|---------------|------------------------------------------|
| id                  | SERIAL        | PRIMARY KEY                              |
| teacher_id          | INT           | REFERENCES teachers(id)                  |
| student_id          | INT           | REFERENCES students(id)                  |
| education_level_id  | INT           | REFERENCES education_levels(id)         |
| subject_id          | INT           | REFERENCES subjects(id) ON DELETE SET NULL, nullable |
| date                | DATE          | NOT NULL                                 |
| start_time          | TIME          | nullable (migration)                     |
| hours               | DECIMAL(4,2)  | NOT NULL                                 |
| approved            | BOOLEAN       | DEFAULT FALSE                            |
| total_cost          | DECIMAL(10,2) | nullable                                 |
| price_locked        | BOOLEAN       | DEFAULT FALSE (migration)               |
| seeded_by_script    | BOOLEAN       | DEFAULT FALSE                            |
| created_at          | TIMESTAMP     | DEFAULT NOW()                            |
| deleted_at          | TIMESTAMP     | nullable (migration)                     |
| deletion_note       | TEXT          | nullable (migration)                     |

---

## 9. `group_lessons`
| Column              | Type          | Notes                                    |
|---------------------|---------------|------------------------------------------|
| id                  | SERIAL        | PRIMARY KEY                              |
| teacher_id          | INT           | REFERENCES teachers(id)                  |
| education_level_id  | INT           | REFERENCES education_levels(id)         |
| subject_id          | INT           | REFERENCES subjects(id) ON DELETE SET NULL, nullable |
| date                | DATE          | NOT NULL                                 |
| start_time          | TIME          | nullable (migration)                     |
| hours               | DECIMAL(4,2)  | NOT NULL                                 |
| approved            | BOOLEAN       | DEFAULT FALSE                            |
| total_cost          | DECIMAL(10,2) | nullable                                 |
| price_locked        | BOOLEAN       | DEFAULT FALSE (migration)               |
| seeded_by_script    | BOOLEAN       | DEFAULT FALSE                            |
| created_at          | TIMESTAMP     | DEFAULT NOW()                            |
| deleted_at          | TIMESTAMP     | nullable (migration)                     |
| deletion_note       | TEXT          | nullable (migration)                     |

---

## 10. `group_lesson_students`
| Column           | Type   | Notes                                          |
|------------------|--------|------------------------------------------------|
| group_lesson_id  | INT    | REFERENCES group_lessons(id) ON DELETE CASCADE, PK |
| student_id       | INT    | REFERENCES students(id) ON DELETE CASCADE, PK  |
| seeded_by_script | BOOLEAN| DEFAULT FALSE (in one schema variant)          |

---

## 11. `payments`
| Column        | Type          | Notes                       |
|---------------|---------------|-----------------------------|
| id            | SERIAL        | PRIMARY KEY                 |
| student_id    | INT           | REFERENCES students(id)     |
| amount        | DECIMAL(10,2) | NOT NULL                    |
| payment_date  | DATE          | NOT NULL DEFAULT CURRENT_DATE |
| note          | TEXT          | nullable                    |
| created_at    | TIMESTAMP     | DEFAULT NOW()               |

---

## 12. `app_settings` (migration)
| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| id          | SERIAL      | PRIMARY KEY                    |
| key         | VARCHAR(100)| UNIQUE NOT NULL                 |
| value       | TEXT        | NOT NULL                       |
| description | TEXT        | nullable                       |
| updated_at  | TIMESTAMP   | DEFAULT NOW()                  |
| updated_by  | INT         | REFERENCES users(id), nullable |

---

## Summary (table list only)

1. **users** – login/roles  
2. **teachers** – linked to users, name, phone  
3. **education_levels** – ابتدائي، إعدادي، ثانوي، جامعي  
4. **subjects** – special subjects (رياضيات، فيزياء، محاسبة، حاسوب، دروس علاجية) each with price_per_hour  
5. **students** – name, level, class, soft delete  
6. **pricing** – per level + lesson_type (individual/group) for **regular** lessons  
7. **group_pricing_tiers** – per level + student count  
8. **individual_lessons** – one teacher, one student; optional subject_id (null = regular, set = special)  
9. **group_lessons** – one teacher, many students; optional subject_id (null = regular, set = special)  
10. **group_lesson_students** – junction group_lessons ↔ students  
11. **payments** – student payments  
12. **app_settings** – key/value app config  
