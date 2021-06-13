---
layout: post
class: post
categories:
  - Code
  - Tracking
title: Removing Google Analytics
subtitle: '"Please disable JavaScript to view this site" – Heydon Pickering'
syndications:
  twitter: 'https://twitter.com/henrahmagix/status/1335590145073025025'
updates:
  - date: 2021-06-12T22:04:00.000Z
    title: oh no
---

I've been following the _glory_ that is Heydon Pickering ([@heydonworks](https://twitter.com/heydonworks)) [moving their WHOLE SITE into a `<noscript>` element](https://twitter.com/heydonworks/status/1332620108129312768) and showing users a very simple message:

>Please disable JavaScript to view this site.

At first I was 😵

But then I was 🙌

Turns out, a lot of people [didn't get it](https://twitter.com/heydonworks/status/1334064737332629505); there were lots of [explain-a-brags](https://www.reddit.com/r/community/comments/5wrqgk/that_was_an_explainabrag/ 'Brita from the TV show "Community" saying "It's called a "Complisult". Part compliment, part insult. He invented them. I coined the term. See what I did just there? That was an explainabrag."') about how Heydon's action was antithetical to the point being made about accessibility.

Hmm, maybe they didn't realise that their feelings about being excluded were _exactly the point:_ to remind them about how others feel when they are excluded by JS-only sites.

## Holier than thou?

Sadly, I have made JS-only sites before. The biggest was in my last job, where we were tasked with quickly building a product for academia. The chosen technical architecture was all microservices: [Go](https://golang.org) backends providing data for [Angular](https://angular.io/) frontends. (Oddly, there were 4 pages to the product, and each page was it's own Angular app served from its own CDN folder, just so we didn't have to deal with combining and deploying multiple teams' code together, nor deal with frontend routing.)

Anyway, I was aware of the incoming [European Accessibility Act](https://ec.europa.eu/social/main.jsp?catId=1202) and how we would likely be subject to it once we start selling to publicly-funded groups. I was already annoying my superiors by pushing for "accessibility by design" before we even started on this new product – "it's not in the budget" is SUPER wrong 😡 AND it should not be annoying! 🤬 – so rendering all the HTML in JS didn't make me push any less 🤷‍♂️😅. (I did have the backing of other devs and we all worked together to ensure the product was as accessible as it could be – hooray for nice people 🙌)

Turns out the cons of server-side rendering in Go weren't as bad as realising halfway through that our website was not being included in search results, because it was inaccessible to non-JS scraper bots (which is like all of them, right?). So we had to render _some_ HTML in the Go backends, but it was too far gone to start over. Also, we had to do _a bunch more work_ to implement Facebook-like placeholders because, yet again, IT TURNS OUT no one liked how the page content flashed in as it arrived from the various backend microservices. 💁‍♂️

So, yeah, I've contributed to an inaccessible website.

<small class="secret">I and the majority of the company were made redundant shortly before Covid hit; maybe you can guess why 😉</small>

## But what's that got to do with Google Analytics?

In the last few months, I've been moving myself off Google's Chrome browser to using Safari everyday. I guess it finally clicked in me how much I hate the feeling of being known and tracked by using Google's free services. (I've also bought a Hey email for the same reason. <sup>[*oh no](#2021-06-12)</sup>)

When I first built this site, I put Google Analytics on it because... well, it was "the done thing". Then I started sending an event to it whenever someone used my iPad Cursor emulation. But I never looked at the data. I took a look a few days ago and there's nothing interesting there:

- I don't need to know how many people view my site
- I don't need to know what devices they use
- I don't need to know where they're browsing from
- I plainly don't need to know

So [bye bye Google](https://github.com/henrahmagix/henrahmagix.github.io/commit/64854cc8fb8393a04d42a4624172c665e2d37c18 "My commit that removes Google Analytics from this site") 👋

## So, uh, how does this relate to Heydon Pickering?

The discussion around Heydon blocking JS-enabled browsers from viewing their site – here's an [example](https://twitter.com/heydonworks/status/1334064737332629505 "An example of Heydon replying to people who just didn't get it") – earned a follow from myself, and then I noticed there was a conversation about tracking users, the data of whom would supposedly confirm if Heydon's point was correct. It culminated in this:
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">In all my years building sites and apps, I&#39;m yet to have a client that even did something useful with the analytics they had. They wouldn&#39;t even set browser scope based on analytics. <br><br>So, I would challenge anyone to not capture data they aren&#39;t going to use.</p>&mdash; Frank M. Total Landscaping Taylor (@Paceaux) <a href="https://twitter.com/Paceaux/status/1333424995758977024?ref_src=twsrc%5Etfw">November 30, 2020</a></blockquote>

<small>Note: I removed the script that comes with the tweet embed code because, to be honest, it's not really needed here, and at least I can style it for colour contrast and light/dark modes.</small>

Consider myself challenged 🤗

<hr>

## Updates

### 2021-06-12

<https://www.theverge.com/2021/4/27/22406673/basecamp-political-speech-policy-controversy>

I was following along with everyone else on Twitter as this all unfolded. Along with thoroughly disliking the "thought leadership" on display (silence always favours the oppressors), I wasn't even using the app/service. I kept forgetting to cancel and get a refund; it was an impulse purchase in attempt no.142 to "get organised in my life", which is an ongoing struggle and, as usual, it didn't help much 😅
