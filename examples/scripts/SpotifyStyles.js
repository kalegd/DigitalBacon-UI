import { Style } from 'digitalbacon-ui';

export const primaryContent = new Style({
    height: 0.86,
    width: '100%',
});

export const sectionStyle = new Style({
    backgroundVisible: true,
    borderRadius: 0.01,
    glassmorphism: true,
    materialColor: 0xaaaaaa,
});
export const recentlyPlayedRowStyle = new Style({
    height: 0.1,
    justifyContent: 'spaceBetween',
    width: '100%',
});
export const recentlyPlayedTrackStyle = new Style({
    backgroundVisible: true,
    borderRadius: 0.005,
    glassmorphism: true,
    height: '80%',
    materialColor: 0x606d75,
    overflow: 'none',
    width: 0.365,
});
export const recentlyPlayedImageStyle = new Style({
    borderTopLeftRadius: 0.01,
    borderBottomLeftRadius: 0.01,
    height: '100%',
});
export const colorWhite = new Style({ color: 0xffffff });
export const materialColorWhite = new Style({ materialColor: 0xffffff });
export const materialColorGreen = new Style({ materialColor: 0x1db954 });
export const materialColorBlue = new Style({ materialColor: 0x1db7b9 });
export const fontSmall = new Style({ fontSize: 0.02 });
export const fontMedium = new Style({ fontSize: 0.025 });
export const fontLarge = new Style({ fontSize: 0.03 });
export const fontXLarge = new Style({ fontSize: 0.04 });
export const font500 = new Style({
    font: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAA.woff',
});
export const font700 = new Style({
    font: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAA.woff',
});
export const homeSectionHovered = new Style(font700);
export const homeSectionActive = new Style(font700);
export const buttonHovered = new Style(materialColorWhite);
export const buttonActive = new Style(materialColorWhite);
