@props([
    'size' => 'md',
    'showText' => true,
    'tagline' => true,
    'textClass' => '',
])

@php
    $sizeClasses = [
        'sm' => 'w-8 h-8',
        'md' => 'w-10 h-10',
        'lg' => 'w-14 h-14',
    ];
    $imgSize = $sizeClasses[$size] ?? $sizeClasses['md'];
@endphp

<div {{ $attributes->merge(['class' => 'flex items-center gap-3']) }}>
    <img
        src="{{ asset('icons/logo.svg') }}"
        alt="Wantex"
        class="{{ $imgSize }} rounded-xl shrink-0 object-cover shadow-lg shadow-pink-900/20"
    />
    @if ($showText)
        <div class="{{ $textClass }}">
            <div class="font-bold text-lg leading-tight tracking-wide">
                WAN<span class="text-pink-400">TEX</span>
            </div>
            @if ($tagline)
                <div class="text-[10px] opacity-70 leading-tight">
                    Excellence en confection textile
                </div>
            @endif
        </div>
    @endif
</div>
