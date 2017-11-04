const settings = (function() {
    const dialogEl = $("#settings-dialog");
    const tabsEl = $("#settings-tabs");

    const settingModules = [];

    function addModule(module) {
        settingModules.push(module);
    }

    async function showDialog() {
        glob.activeDialog = dialogEl;

        const settings = await $.ajax({
            url: baseApiUrl + 'settings',
            type: 'GET',
            error: () => error("Error getting settings.")
        });

        dialogEl.dialog({
            modal: true,
            width: 600
        });

        tabsEl.tabs();

        for (module of settingModules) {
            module.settingsLoaded(settings);
        }
    }

    function saveSettings(settingName, settingValue) {
        return $.ajax({
            url: baseApiUrl + 'settings',
            type: 'POST',
            data: JSON.stringify({
                name: settingName,
                value: settingValue
            }),
            contentType: "application/json",
            success: () => {
                message("Settings change have been saved.");
            },
            error: () => alert("Error occurred during saving settings change.")
        });
    }

    return {
        showDialog,
        saveSettings,
        addModule
    };
})();

settings.addModule((function() {
    const formEl = $("#change-password-form");
    const oldPasswordEl = $("#old-password");
    const newPassword1El = $("#new-password1");
    const newPassword2El = $("#new-password2");

    function settingsLoaded(settings) {
    }

    formEl.submit(() => {
        const oldPassword = oldPasswordEl.val();
        const newPassword1 = newPassword1El.val();
        const newPassword2 = newPassword2El.val();

        oldPasswordEl.val('');
        newPassword1El.val('');
        newPassword2El.val('');

        if (newPassword1 !== newPassword2) {
            alert("New passwords are not the same.");
            return false;
        }

        $.ajax({
            url: baseApiUrl + 'password/change',
            type: 'POST',
            data: JSON.stringify({
                'current_password': oldPassword,
                'new_password': newPassword1
            }),
            contentType: "application/json",
            success: result => {
                if (result.success) {
                    // encryption password changed so current encryption session is invalid and needs to be cleared
                    encryption.resetEncryptionSession();

                    encryption.setEncryptedDataKey(result.new_encrypted_data_key);

                    message("Password has been changed.");
                }
                else {
                    message(result.message);
                }
            },
            error: () => error("Error occurred during changing password.")
        });

        return false;
    });

    return {
        settingsLoaded
    };
})());

settings.addModule((function() {
    const formEl = $("#encryption-timeout-form");
    const encryptionTimeoutEl = $("#encryption-timeout-in-seconds");
    const settingName = 'encryption_session_timeout';

    function settingsLoaded(settings) {
        encryptionTimeoutEl.val(settings[settingName]);
    }

    formEl.submit(() => {
        const encryptionTimeout = encryptionTimeoutEl.val();

        settings.saveSettings(settingName, encryptionTimeout).then(() => {
            encryption.setEncryptionSessionTimeout(encryptionTimeout);
        });

        return false;
    });

    return {
        settingsLoaded
    };
})());

settings.addModule((function () {
    const formEl = $("#history-snapshot-time-interval-form");
    const timeIntervalEl = $("#history-snapshot-time-interval-in-seconds");
    const settingName = 'history_snapshot_time_interval';

    function settingsLoaded(settings) {
        timeIntervalEl.val(settings[settingName]);
    }

    formEl.submit(() => {
        settings.saveSettings(settingName, timeIntervalEl.val());

        return false;
    });

    return {
        settingsLoaded
    };
})());