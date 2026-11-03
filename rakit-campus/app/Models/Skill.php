<?php

namespace App\Models;

use App\Enums\SkillType;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    protected $fillable = ['name', 'slug', 'type'];

    protected function casts(): array
    {
        return ['type' => SkillType::class];
    }

    /** Finds or creates a skill from a free-text name (case-insensitive via slug). */
    public static function resolve(string $name, SkillType $type = SkillType::Technical): self
    {
        $name = trim(preg_replace('/\s+/', ' ', $name));
        $slug = \Illuminate\Support\Str::slug($name);

        return static::firstOrCreate(['slug' => $slug], ['name' => $name, 'type' => $type->value]);
    }
}
