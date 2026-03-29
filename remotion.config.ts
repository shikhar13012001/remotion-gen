import { Config } from "@remotion/cli/config";

Config.setConcurrency(4);
Config.setVideoImageFormat("jpeg");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setOutputLocation("out/video.mp4");
