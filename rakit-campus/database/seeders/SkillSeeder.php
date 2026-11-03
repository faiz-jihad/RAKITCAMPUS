<?php

namespace Database\Seeders;

use App\Enums\SkillType;
use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        $technical = [
            'Flutter', 'Dart', 'React', 'TypeScript', 'JavaScript', 'Next.js', 'Vue.js',
            'Laravel', 'PHP', 'Node.js', 'Python', 'FastAPI', 'Django', 'Go',
            'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
            'Docker', 'Kubernetes', 'CI/CD', 'Git', 'AWS', 'GCP',
            'UI/UX Design', 'Figma', 'Wireframing', 'Prototyping',
            'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow',
            'Data Analysis', 'Pandas', 'Computer Vision', 'NLP',
            'Cybersecurity', 'Penetration Testing', 'Network Security',
            'Mobile Development', 'REST API', 'GraphQL', 'Tailwind CSS'
        ];

        $soft = [
            'Problem Solving', 'Team Leadership', 'Communication', 'Time Management',
            'Critical Thinking', 'Agile / Scrum', 'Public Speaking', 'Collaboration',
            'Product Management', 'Design Thinking'
        ];

        foreach ($technical as $name) {
            Skill::resolve($name, SkillType::Technical);
        }

        foreach ($soft as $name) {
            Skill::resolve($name, SkillType::Soft);
        }
    }
}
