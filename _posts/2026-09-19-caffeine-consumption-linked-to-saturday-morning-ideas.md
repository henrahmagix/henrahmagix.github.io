---
layout: post
class: post
title: Caffeine Consumption Linked to Saturday Morning Ideas
subtitle: ''
pre_content:
  - null
syndications:
  mastodon: https://tech.lgbt/@henrahmagix/117297728428019394
image: /images/posts/caffeine-consumption-linked-to-saturday-morning-ideas.jpeg
image_alt: Link (from Skyward Sword) falling asleep in a chair in front of a desk.
---

# Thoughts

## If you use a FOSS library and don’t know the internals, does writing your own version allow you to distance from the fascist creator?

I’ve been thinking about Rails and Hotwire (Turbo/Stimulus). I also remembered that episode of Halt And Catch Fire where one person exfiltrated the bytecode of a competitor’s chip whilst another writes firmware towards specific goals but never the twain shall meet because that’s illegal.

Of course this FOSS (is Rails and Hotwire FOSS? I know it’s OSS and it’s also Free so that does make it FOSS doesn’t it? but it’s not GPL so like, y’know?) doesn’t have the same copyright legalities (except maybe trademark?) but I still think about how one goes about creating a replacement for a community library. The whole “just fork it!” has always felt off to me, cos you’re still writing on top off the thing created by the fascist. Plus I like writing things from scratch, I find it fun, so that’s why im leaning on writing a replacement from scratch. 

Feels easier to me than forking and thus supporting the *entire* feature set. Though of course maybe not many would be able to use it as a drop-in replacement due to it not having full feature parity straight away.

## How much does a library need to be updated?

Not often, I don’t think. Once a thing is written and it works, it should continue working as-is depending on the volatility of the environment in which it’s used.

Of course with Ruby libraries one would want to always test against the latest version to increase utility of your library. And because Ruby is what it is, breaking changes are acceptable. 

JavaScript is easier in that sense because it’s very unlikely for long-standing features and syntax to be broken. So one won’t need to update a library for any reason other than bugs and necessary improvements. Especially when you’re not depending on anything apart from the stdlib.

## Are Nintendo’s game key cards that bad?

I think they are. Rather, they’re annoying because of what they are. They purport to be a physical game but they rely on DRM servers being online _forever_ OR for me to store the game download _forever_ on a switch memory card. 

I like that Nintendo’s first party games are on the cart, but get frustrated when other publishers do game key cards. I really very liked Hades 2 being on the card! Yay for them doing that! I will remember that for a long time, good on them. 

# Ideas

## Play Skyward Sword and Windwaker before the Ocarina of Time remake arrives on November 6th

<img class="post-header-image" src="{{page.image}}" alt="{{page.image_alt}}">

This feels possible. But then £45 for Skyward Sword feels a bit much so im watching on ebay. 

Maybe including windwaker in that is a bit much cos I got very stuck when I first played it back in the 2000s 🙈

## Write my own Stimulus JavaScript library

I already have a rails library to test stimulus controllers in Ruby: https://github.com/henrahmagix/stimulus_tests

It doesn’t feel overly complex to write myself, and it would be fun. Also proposing it as a drop-in replacement perhaps helps the community to distance from Rails and DHH. 

## Look for or consider writing simple Active\*/Action\* replacement

I know Sinatra is a good alternative to Rails, but in any particular monolith there is a heck of a lot of dependency on e.g. ActiveRecord and ActiveSupport and ActionView.

Of course there’s a heckuva lot of code in those libraries, but perhaps most of it is supporting extended feature sets without which a simple version might be able to start off?

Anyway it’s just another part of me thinking how I might contribute to the Ruby community that’s actively still using Rails because they have to (work, time and difficulty to refactor, etc.) but don’t want to anymore for good reasons. And I like writing code from scratch to provide a public interface I already know very well.
