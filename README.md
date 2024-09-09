# Streaming JSON and Structured Outputs with the OpenAI API via javascript
In the process of building my new AI project, [CoachMorgan.ai](https://www.coachmorgan.ai), I adopted the [Structured Output API](https://platform.openai.com/docs/guides/structured-outputs) from OpenAI for building my chat interface.

Unfortunately, while trying to improve the first-character latency of my chat application, I discovered neither the JSON or Structured Output APIs support streaming yet and support from other LLMs will probably lag.

After searching around GitHub, Reddit and elsewhere for an existing solution to this problem, I found none and so I built this one for myself and others to use.

Enjoy!

# Usage
You can directly copy the provided code (minimal) into your repo - it is MIT licensed and I have no intention of uploading to NPM, etc.

See examples.js for example usage
