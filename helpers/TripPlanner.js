const fs = require("fs");
const path = require("path");

class TripPlannerNLP {
    constructor() {

        const wilayaFilePath = path.join(__dirname, "../data/wilayas.json");
        const statesData = JSON.parse(fs.readFileSync(wilayaFilePath, "utf8"));
        
        this.states = statesData.map(state => state.name.toLowerCase())
        console.log(this.states)

        this.venueTypes = {
            hotel: ['hotel', 'motel', 'inn', 'resort', 'lodge'],
            restaurant: ['restaurant', 'cafe', 'diner', 'eatery', 'bistro', 'lunch', 'dinner', 'breakfast'],
            attraction: ['attraction', 'museum', 'park', 'gallery', 'monument', 'theater', 'zoo', 'garden', 'visit']
        };


        this.timeIndicators = {
            morning: ['morning', 'breakfast', 'early'],
            afternoon: ['afternoon', 'lunch'],
            evening: ['evening', 'dinner', 'night']
        };

        // Negation words and phrases
        this.negationWords = [
            'not',
            'no',
            "don't",
            'dont',
            "doesn't",
            'doesnt',
            'never',
            'without',
            'except',
            'exclude',
            'avoiding',
            'avoid'
        ];
    }

    parseInput(input) {
        const lowercaseInput = input.toLowerCase();
        const sentences = this.splitIntoSentences(lowercaseInput);
        
        const itinerary = {
            state: this.extractState(lowercaseInput),
            venues: [],
            exclusions: [], // New array to track excluded venues
            originalInput: input
        };

        // Extract venues and their sequence
        sentences.forEach(sentence => {
            const { venues, exclusions } = this.extractVenuesWithNegation(sentence);
            itinerary.venues.push(...venues);
            itinerary.exclusions.push(...exclusions);
        });

        // Clean up duplicate consecutive venues
        itinerary.venues = this.removeDuplicateConsecutiveVenues(itinerary.venues);
        
        return itinerary;
    }

    splitIntoSentences(text) {
        return text.split(/[.,!?]|\bthen\b|\bafter that\b|\band\b/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    extractVenuesWithNegation(sentence) {
        const venues = [];
        const exclusions = [];
        const words = sentence.split(' ');
        
        // Check for negation context
        const negationIndices = words.reduce((indices, word, index) => {
            if (this.negationWords.includes(word)) {
                indices.push(index);
            }
            return indices;
        }, []);

        for (const [venueType, keywords] of Object.entries(this.venueTypes)) {
            for (const keyword of keywords) {
                const keywordIndex = words.indexOf(keyword);
                if (keywordIndex !== -1) {
                    // Check if the keyword is in the scope of any negation
                    const isNegated = negationIndices.some(negIndex => {
                        // Consider negation scope to be 5 words after the negation word
                        return keywordIndex > negIndex && keywordIndex - negIndex <= 5;
                    });

                    const venueInfo = {
                        type: venueType,
                        timeOfDay: this.extractTimeOfDay(sentence),
                        originalText: sentence
                    };

                    if (isNegated) {
                        exclusions.push(venueInfo);
                    } else {
                        venues.push(venueInfo);
                    }
                    break;
                }
            }
        }

        return { venues, exclusions };
    }

    extractState(text) {
        for (const stateName of this.states) {
            if (text.includes(stateName)) {
                return stateName;
            }
        }
        return null;
    }

    extractTimeOfDay(sentence) {
        for (const [timeOfDay, keywords] of Object.entries(this.timeIndicators)) {
            for (const keyword of keywords) {
                if (sentence.includes(keyword)) {
                    return timeOfDay;
                }
            }
        }
        return null;
    }

    removeDuplicateConsecutiveVenues(venues) {
        return venues.filter((venue, index, array) => {
            if (index === 0) return true;
            return venue.type !== array[index - 1].type;
        });
    }
}


const tripPlanner = new TripPlannerNLP();

module.exports = tripPlanner;