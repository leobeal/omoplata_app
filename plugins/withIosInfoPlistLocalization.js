const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const LOCALIZATIONS = {
  en: {
    NSPhotoLibraryAddUsageDescription:
      'Allow $(PRODUCT_NAME) to save your membership card to your photo library',
  },
  de: {
    NSPhotoLibraryAddUsageDescription:
      'Erlaube $(PRODUCT_NAME), deine Mitgliedskarte in deiner Fotomediathek zu speichern',
  },
  'pt-BR': {
    NSPhotoLibraryAddUsageDescription:
      'Permitir que $(PRODUCT_NAME) salve seu cartão de associado na sua biblioteca de fotos',
  },
  tr: {
    NSPhotoLibraryAddUsageDescription:
      '$(PRODUCT_NAME) uygulamasının üyelik kartınızı fotoğraf kitaplığınıza kaydetmesine izin verin',
  },
};

function withIosInfoPlistLocalization(config) {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    const iosPath = path.join(projectRoot, 'ios', projectName);

    const project = config.modResults;

    for (const [locale, strings] of Object.entries(LOCALIZATIONS)) {
      const lprojFolder = `${locale}.lproj`;
      const lprojPath = path.join(iosPath, lprojFolder);

      // Create the .lproj folder if it doesn't exist
      if (!fs.existsSync(lprojPath)) {
        fs.mkdirSync(lprojPath, { recursive: true });
      }

      // Generate InfoPlist.strings content
      const content = Object.entries(strings)
        .map(([key, value]) => `"${key}" = "${value}";`)
        .join('\n');

      const infoPlistStringsPath = path.join(lprojPath, 'InfoPlist.strings');
      fs.writeFileSync(infoPlistStringsPath, content);

      // Add the localization to the Xcode project
      const groupName = lprojFolder;
      const groupPath = lprojFolder;

      // Find or create the localization group
      let group = project.pbxGroupByName(groupName);
      if (!group) {
        // Add the .lproj folder to the project
        project.addLocalizationVariantGroup('InfoPlist.strings');
      }

      // Add known regions to the project
      const pbxProject = project.pbxProjectSection();
      const projectUuid = Object.keys(pbxProject).find(
        (key) => !key.endsWith('_comment') && pbxProject[key].buildConfigurationList
      );

      if (projectUuid && pbxProject[projectUuid]) {
        const knownRegions = pbxProject[projectUuid].knownRegions || [];
        const regionCode = locale === 'pt-BR' ? 'pt-BR' : locale;
        if (!knownRegions.includes(regionCode)) {
          knownRegions.push(regionCode);
          pbxProject[projectUuid].knownRegions = knownRegions;
        }
      }
    }

    return config;
  });
}

module.exports = withIosInfoPlistLocalization;
