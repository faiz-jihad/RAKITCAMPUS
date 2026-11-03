<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'department' => ['nullable', 'string', 'max:100'],
            'study_program' => ['nullable', 'string', 'max:100'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:14'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'interests' => ['nullable', 'array'],
            'interests.*' => ['string', 'max:50'],
            'preferred_roles' => ['nullable', 'array'],
            'preferred_roles.*' => ['string', 'max:50'],
            'availability_hours' => ['nullable', 'integer', 'min:0', 'max:80'],
            'availability_note' => ['nullable', 'string', 'max:255'],
            'portfolio_public' => ['nullable', 'boolean'],
            'open_to_invites' => ['nullable', 'boolean'],
            'skills' => ['nullable', 'array'],
            'skills.*.id' => ['nullable', 'integer'],
            'skills.*.name' => ['nullable', 'string', 'max:80'],
            'skills.*.proficiency' => ['nullable', 'integer', 'min:1', 'max:5'],
        ];
    }
}
