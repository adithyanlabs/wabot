const { Function } = require("../lib/");

Function({
    pattern: "gjid ?(.*)",
    fromMe: true,
    desc: "Get group JIDs with optional search filter",
    type: "whatsapp"
}, async (message, searchText) => {
    const groupsData = await message.client.groupFetchAllParticipating();
    const groups = Object.values(groupsData);
    let result = "";
    
    if (searchText) {
        const filteredGroups = groups.filter(group => 
            group.subject.toLowerCase().includes(searchText.toLowerCase())
        );
        
        for (const group of filteredGroups) {
            result += `*Group :* ${group.subject}\n*JID :* ${group.id}\n\n`;
        }
        
        if (!result) {
            result = `No groups found matching: "${searchText}"`;
        }
    } else {
        for (const group of groups) {
            result += `*Group :* ${group.subject}\n*JID :* ${group.id}\n\n`;
        }
    }
    
    message.send(result.trim());
});