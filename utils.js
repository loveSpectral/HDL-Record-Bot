const { githubBranch, githubDataPath, githubOwner, githubRepo } = require('./config.json');

module.exports = {
	async updateCachedLevels() {

		const { octokit, cache } = require('./index.js');
		const levels = [];
		console.log('Updating cached levels...');

		let listFileResponse;
		try {
			listFileResponse = await octokit.rest.repos.getContent({
				owner: githubOwner,
				repo: githubRepo,
				path: githubDataPath + `/_list.json`,
				branch: githubBranch,
			});
		} catch (fetchError) {
			console.log(`Couldn't fetch _list.json: \n${fetchError}`);
			return -1;
		}

		let list_data;
	
		try {
			list_data = JSON.parse(Buffer.from(listFileResponse.data.content, 'base64').toString('utf-8'));
		} catch (parseError) {
			console.log(`Unable to parse data fetched from _list.json:\n${parseError}`);
			return -1;
		}
		
		let i = 1;
		for (const filename of list_data) {
			let fileResponse;
			try {
				fileResponse = await octokit.rest.repos.getContent({
					owner: githubOwner,
					repo: githubRepo,
					path: githubDataPath + `/${filename}.json`,
					branch: githubBranch,
				});
			} catch (fetchError) {
				console.log(`Couldn't fetch ${filename}.json: \n${fetchError}`);
				continue;
			}
			let parsedData;
			try {
				parsedData = JSON.parse(Buffer.from(fileResponse.data.content, 'base64').toString('utf-8'));
			} catch (parseError) {
				console.log(`Unable to parse data fetched from ${filename}.json:\n${parseError}`);
				continue;
			}
			
			levels.push({ name: parsedData.name, position: i, filename: filename});
			i++;
		}

		cache.levels.destroy({ where: {}});
			try {
				cache.levels.bulkCreate(levels);
				console.log(`Successfully updated ${levels.length} cached levels.`);
			} catch (error) {
				console.log(`Couldn't udate cached levels, something went wrong with sequelize: ${error}`);
			}
	},
	async updateCachedUsers() {

		const { octokit, cache } = require('./index.js');
		const users = [];
		console.log('Updating cached users...');

		let usersFileResponse;
		try {
			usersFileResponse = await octokit.rest.repos.getContent({
				owner: githubOwner,
				repo: githubRepo,
				path: githubDataPath + `/_name_map.json`,
				branch: githubBranch,
			});
		} catch (fetchError) {
			console.log(`Couldn't fetch _name_map.json: \n${fetchError}`);
			return -1;
		}
		
		let users_data;
	
		try {
			users_data = JSON.parse(Buffer.from(usersFileResponse.data.content, 'base64').toString('utf-8'));
		} catch (parseError) {
			console.log(`Unable to parse data fetched from _list.json:\n${parseError}`);
			return -1;
		}

		
		for (const user of Object.keys(users_data)) {
			users.push({ name: users_data[user], user_id: user});
		}

		cache.users.destroy({ where: {}});
		try {
			cache.users.bulkCreate(users);
			console.log(`Successfully updated ${users.length} cached users.`);
		} catch (error) {
			console.log(`Couldn't udate cached users, something went wrong with sequelize: ${error}`);
		}
	},
};