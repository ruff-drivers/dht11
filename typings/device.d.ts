export declare class DHT11 extends RuffDevice {
    /**
     * Get the temperature.
     * @param callback - The callback to process the temperature
     *
     */
    getTemperature(callback: (error: Error, value: number) => void): void;

    /**
     * Get the relative humidity.
     * @param callback - The callback to process the relative humidity
     */
    getHumidityRelative(callback: (error: Error, value: number) => void): void;
}

export default DHT11;
