<x-guest-layout>
    <div class="mb-6 text-center">
        <div class="flex justify-center mb-4">
            <x-wantex-logo size="lg" class="justify-center" />
        </div>
    </div>

    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf
        <div>
            <x-input-label for="email" value="Email" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="password" value="Mot de passe" />
            <x-text-input id="password" class="block mt-1 w-full" type="password" name="password" required />
            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>
        <div class="block mt-4">
            <label for="remember_me" class="inline-flex items-center">
                <input id="remember_me" type="checkbox" class="rounded border-gray-300 text-pink-600" name="remember">
                <span class="ms-2 text-sm text-gray-600">Se souvenir de moi</span>
            </label>
        </div>
        <div class="flex items-center justify-end mt-4">
            <x-primary-button class="bg-pink-700 hover:bg-pink-800">Connexion</x-primary-button>
        </div>
    </form>
</x-guest-layout>
