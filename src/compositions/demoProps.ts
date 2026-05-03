import type { Props } from "./ShortsComposition";

export const DEMO_PROPS: Props = {
  scenes: [
    { text: "5.4 billion people are online right now.",                                          highlightWords: ["5.4 billion"],         dataValue: 5400000000 },
    { text: "That's 67% of every human alive today.",                                           highlightWords: ["67%"],                  dataValue: 67 },
    { text: "Global internet users have grown 600% since 2000.",                                highlightWords: ["600%"],                 dataValue: 600 },
    { text: "YouTube, Facebook, and Netflix eat 80% of bandwidth.",                             highlightWords: ["80%"],                  dataValue: 80 },
    { text: "Fiber is 100× faster than copper for the same cost.",                              highlightWords: ["100×"],                 dataValue: 100 },
    { text: "60% of web traffic now comes from mobile devices.",                                highlightWords: ["60%"],                  dataValue: 60 },
    { text: "Internet access has spread to 180+ countries.",                                    highlightWords: ["180+"],                 dataValue: 180 },
    { text: "Nordic countries lead at 97% penetration.",                                        highlightWords: ["97%"],                  dataValue: 97 },
    { text: "From ARPANET in 1969 to 5G in 2019.",                                             highlightWords: ["ARPANET", "5G"],        dataValue: null },
    { text: "Every packet you send hops through 10 routers.",                                   highlightWords: ["10 routers"],           dataValue: 10 },
    { text: "Data travels as pulses of light in glass fibers.",                                 highlightWords: ["light"],                dataValue: null },
    { text: "We spend our days on email, video, and search.",                                   highlightWords: ["email", "video"],       dataValue: null },
    { text: "The web was a dot — now it's the universe.",                                       highlightWords: ["universe"],             dataValue: null },
    { text: "Every second, 6,000 tweets and 1,000 photos are posted.",                         highlightWords: ["6,000 tweets"],         dataValue: 6000 },
    { text: "1 trillion GB transferred every year.",                                            highlightWords: ["1 trillion"],           dataValue: 1000000000000 },
    { text: "The internet never sleeps — and neither does your data.",                          highlightWords: ["never sleeps"],         dataValue: null },
    { text: "Follow for more mind-blowing tech stats.",                                         highlightWords: ["mind-blowing"],         dataValue: null },
  ],
  sentenceDurations:  [],
  suggestedDurations: [3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000],
  resolvedImages:     new Array(17).fill(null) as null[],
  tokens: {
    fontFamily:  "system-ui, sans-serif",
    colors:      { accent: "#4fc3f7" },
    typography:  {},
    spacing:     {},
    radii:       {},
  },
};
