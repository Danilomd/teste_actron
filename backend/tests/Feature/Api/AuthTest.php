<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_an_api_token(): void
    {
        $response = $this->postJson(route('api.register'), [
            'name' => 'Danilo Silva',
            'email' => '  Danilo@Example.COM  ',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'device_name' => 'iphone',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                'token',
                'token_type',
            ])
            ->assertJsonPath('user.name', 'Danilo Silva')
            ->assertJsonPath('user.email', 'danilo@example.com')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonMissingPath('user.password');

        $user = User::where('email', 'danilo@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
            'name' => 'iphone',
        ]);

        $token = $response->json('token');

        $this->withToken($token)
            ->getJson(route('api.user'))
            ->assertOk()
            ->assertJsonPath('data.email', 'danilo@example.com');
    }

    public function test_register_requires_mandatory_fields(): void
    {
        $response = $this->postJson(route('api.register'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_rejects_duplicate_email_and_unconfirmed_password(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson(route('api.register'), [
            'name' => 'Another User',
            'email' => 'EXISTING@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Different123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'danilo@example.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson(route('api.login'), [
            'email' => 'DANILO@example.com',
            'password' => 'Password123!',
            'device_name' => 'web-client',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                'token',
                'token_type',
            ])
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonMissingPath('user.password');

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
            'name' => 'web-client',
        ]);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson(route('api.login'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'email' => 'danilo@example.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson(route('api.login'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email' => __('auth.failed'),
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson(route('api.login'), [
            'email' => 'missing@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email' => __('auth.failed'),
            ]);
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        $user = User::factory()->create([
            'email' => 'throttle@example.com',
            'password' => 'Password123!',
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson(route('api.login'), [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson(route('api.login'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }

    public function test_authenticated_user_can_logout_and_revoke_only_current_token(): void
    {
        $user = User::factory()->create();

        $currentToken = $user->createToken('current-device');
        $otherToken = $user->createToken('other-device');

        $response = $this->withToken($currentToken->plainTextToken)
            ->postJson(route('api.logout'));

        $response->assertOk()
            ->assertExactJson([
                'message' => 'Logged out successfully.',
            ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $currentToken->accessToken->id,
        ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $otherToken->accessToken->id,
        ]);

        $this->app->make('auth')->forgetGuards();

        $this->withToken($currentToken->plainTextToken)
            ->getJson(route('api.user'))
            ->assertUnauthorized();
    }

    public function test_guest_cannot_logout_or_access_authenticated_user_endpoint(): void
    {
        $this->postJson(route('api.logout'))->assertUnauthorized();
        $this->getJson(route('api.user'))->assertUnauthorized();
    }
}
