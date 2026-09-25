export type TaskSeed = readonly [title: string, minutes: number];
export type SprintPlan = readonly (readonly TaskSeed[])[];

// Source: “Aap Ya Paar - Complete Study Plan.pdf”. Keep this order immutable.
export const STUDY_PLAN: readonly SprintPlan[] = [
  [
    [["Majority Element-I", 17], ["Kadane's Algorithm", 19], ["Majority Element-II", 25], ["Maximum Product Subarray in an Array", 18], ["Sort an array of 0's 1's and 2's", 24], ["3 Sum", 37], ["Next Permutation", 26], ["4 Sum", 27], ["Merge two sorted arrays without extra space", 32]],
    [["Trapping Rainwater", 29], ["Count Inversions", 23], ["Reverse Pairs", 31], ["Two Sum", 17], ["Longest Consecutive Sequence in an Array", 22], ["Longest subarray with sum K", 40], ["Count subarrays with given sum", 22], ["Count subarrays with given xor K", 23], ["Find peak element", 32]],
    [["Find minimum in Rotated Sorted Array", 15], ["Search in rotated sorted array-II", 12], ["Single element in sorted array", 22]],
    [["Search in 2D matrix - II", 15], ["Find Peak Element - II", 20], ["Find Nth root of a number", 20]],
    [["Koko eating bananas", 20], ["Aggressive Cows", 26]],
    [["Introduction to Low Level Design", 21], ["Software Design Principles", 23], ["Single Responsibility Principle (SRP)", 16]],
    [["Open Closed Principle (OCP)", 17], ["Liskov Substitution Principle (LSP)", 18], ["Interface Segregation Principle (ISP)", 10], ["Dependency Inversion Principle (DIP)", 14]],
  ],
  [
    [["Book Allocation Problem", 27], ["Matrix Median", 23], ["Kth element of 2 sorted arrays", 10], ["Median of 2 sorted arrays", 50], ["Longest Substring Without Repeating Characters", 22], ["Maximum Points You Can Obtain from Cards", 11], ["Max Consecutive Ones III", 29], ["Longest Repeating Character Replacement", 25], ["Longest Substring With At Most K Distinct Characters", 21]],
    [["Minimum Window Substring", 26], ["Number of Substrings Containing All Three Characters", 19], ["Binary Subarrays With Sum", 20], ["Count number of Nice subarrays", 4], ["Power Set", 20], ["Generate Parentheses", 22], ["Letter Combinations of a Phone Number", 12], ["Combination Sum", 16], ["Combination Sum II", 15], ["Subsets II", 21], ["Palindrome partitioning", 18], ["Word Search", 19], ["N Queen", 24]],
    [["Sudoku Solver", 31], ["Find Middle of Linked List", 14]],
    [["Find the intersection point of Y LL", 32], ["Check if LL is palindrome or not", 20]],
    [["Detect a loop in LL", 20], ["Remove Nth node from the back of the LL", 16], ["Find the starting point in LL", 21]],
    [["Unified Modeling Language (UML)", 10], ["Class UML diagrams", 38], ["Introduction to Design Patterns", 10]],
    [["Singleton Design Pattern", 25], ["Factory Method", 16]],
  ],
  [
    [["Length of loop in LL", 14], ["Reverse a LL", 32], ["Merge two Sorted Lists", 18], ["Sort a Linked List of O's 1's and 2's", 22], ["Add two numbers in Linked List", 14], ["Rotate a LL", 12], ["Sort LL", 22], ["Clone a LL with random and next pointer", 33], ["Reverse LL in group of given size K", 24], ["Flattening of LL", 33]],
    [["Next Greater Element", 18], ["Next Greater Element - 2", 15], ["Stock span problem", 19], ["Sum of Subarray Minimums", 23], ["Sum of Subarray Ranges", 10], ["Remove K Digits", 15], ["Sliding Window Maximum", 20], ["Largest rectangle in a histogram", 31], ["Maximum Rectangles", 12], ["Implement Min Stack", 21], ["Asteroid Collision", 17], ["Celebrity Problem", 16]],
    [["LRU Cache", 25]],
    [["LFU Cache", 45], ["Jump Game - I", 10]],
    [["Valid Paranthesis Checker", 25], ["Candy", 30]],
    [["Builder Pattern", 24], ["Abstract Factory", 26]],
    [["Prototype Pattern", 20], ["Adapter Pattern", 17]],
  ],
  [
    [["N meetings in one room", 13], ["Insert Interval", 13], ["Non-overlapping Intervals", 8], ["Minimum number of platforms required for a railway", 18], ["Job sequencing Problem", 16], ["Heapify Algorithm", 23], ["Build heap from a given Array", 15], ["Implement Min Heap", 12], ["K-th Largest element in an array", 44], ["Find Median from Data Stream", 45], ["Level Order Traversal", 8], ["Maximum Width of BT", 21]],
    [["Right/Left View of BT", 12], ["Top View of BT", 9], ["Print all nodes at a distance of K in BT", 16], ["Minimum time taken to burn the BT from a given Node", 17], ["Vertical Order Traversal", 18], ["Print root to leaf path in BT", 10], ["Diameter of Binary Tree", 13], ["LCA in BT", 13], ["Boundary Traversal", 9], ["Construct a BT from Preorder and Inorder", 18], ["Morris Inorder Traversal", 19], ["Maximum path sum", 17]],
    [["Serialize and De-serialize BT", 16], ["Insert a given node in BST", 7], ["LCA in BST", 8], ["Delete a node in BST", 15], ["Inorder successor and predecessor in BST", 10], ["Kth Smallest and Largest element in BST", 8]],
    [["Check if a tree is a BST or not", 9], ["Construct a BST from a preorder traversal", 16], ["Two sum in BST", 14], ["Correct BST with two nodes swapped", 16]],
    [["Largest BST in Binary Tree", 17], ["Flood fill algorithm", 20]],
    [["Number of islands", 24], ["Rotten Oranges", 22]],
    [["Decorator Pattern", 26], ["Facade Pattern", 17], ["Composite Pattern", 21], ["Proxy Pattern", 17], ["Bridge Pattern", 18]],
  ],
  [
    [["Distance of nearest cell having one", 20], ["Surrounded Regions", 23], ["Number of distinct islands", 18], ["Detect a cycle in an undirected graph", 38], ["Bipartite graph", 32], ["Detect a cycle in a directed graph", 23], ["Topological sort or Kahn's algorithm", 26], ["Course Schedule II", 11], ["Alien Dictionary", 20], ["Kosaraju's algorithm", 22]],
    [["Bridges in graph", 23], ["Articulation point in graph", 21], ["Shortest path in undirected graph with unit weights", 16], ["Shortest path in DAG", 26], ["Dijkstra's algorithm", 47], ["Path with minimum effort", 24], ["Cheapest flight within K stops", 23], ["Bellman ford algorithm", 27], ["Floyd warshall algorithm", 30]],
    [["Word ladder I", 28]], [["Word ladder II", 48]], [["Disjoint Set", 41]],
    [["Flyweight Pattern", 19], ["Iterator Pattern", 25]],
    [["Observer Pattern", 18], ["Strategy Pattern", 12], ["Command Pattern", 28]],
  ],
  [
    [["Find the MST weight", 31], ["Number of operations to make network connected", 14], ["Number of islands II", 25], ["Making a large island", 26], ["Frog jump with K distances", 16], ["House robber", 9], ["Ninja's training", 51], ["Unique paths II", 12], ["Best time to buy and sell stock with transaction fees", 6], ["Best time to buy and sell stock IV", 12]],
    [["0 and 1 Knapsack", 40], ["Partition a set into two subsets with minimum absolute sum difference", 29], ["Target sum", 8], ["Coin change II", 22], ["Longest common subsequence", 46], ["Longest common substring", 14], ["Longest palindromic subsequence", 9], ["Longest Increasing Subsequence", 40], ["Number of Longest Increasing Subsequences", 20]],
    [["Edit distance", 37]], [["Wildcard matching", 43]], [["Matrix chain multiplication", 61]],
    [["Template Method", 17], ["State Pattern", 21], ["Chain of Responsibility", 17]],
    [["Visitor Pattern", 23], ["Mediator Pattern", 14], ["Memento Pattern", 17]],
  ],
  [
    [["Palindrome partitioning II", 22], ["Trie Implementation and Advanced Operations", 22], ["Longest Word with All Prefixes", 25], ["Number of distinct substrings in a string", 17], ["Maximum XOR of two numbers in an array", 34], ["Maximum Xor with an element from an array", 23], ["Rabin Karp Algorithm", 34], ["Z function", 35]],
    [["KMP Algorithm or LPS array", 29], ["Shortest Palindrome", 7], ["Power Set Bit Manipulation", 12], ["Single Number - II", 30], ["Single Number - III", 24], ["Find the repeating and missing number", 41], ["Print all primes till N", 18], ["Multithreading and Concurrency", 40], ["Creating and Managing Threads", 35]],
    [["Thread Pools and Executors", 32]],
    [["Thread Safety and Synchronization", 29], ["Locks and Synchronization Mechanism", 31]],
    [["Deadlock and Prevention Techniques", 26], ["Producer Consumer Problem", 17]],
    [["Dependency Injection", 19], ["Exception Handling (LLD)", 23]],
    [["Building Resilient Systems", 19]],
  ],
  [
    [["All About API's", 55], ["Database Design and Integration", 24], ["How to approach a LLD Interview", 36], ["Parking Lot (Design)", 38], ["Parking Lot (Code)", 29], ["Logging Framework (Design)", 38]],
    [["Logging Framework (Code)", 22], ["Traffic Signal System (Design)", 60], ["Traffic Signal System (Code)", 24], ["Vending Machine Design", 47], ["Vending Machine Code", 27], ["Task Management System Design", 51]],
    [["Task Management System Code", 22]], [["PubSub System Design", 42]], [["PubSub System Code", 25]], [["ATM Machine Design", 48]], [["ATM Machine Code", 24]],
  ],
  [
    [["Hotel Management System Design", 51], ["Hotel Management System Code", 19], ["Elevator System Design", 44], ["Elevator System Code", 26], ["Digital Wallet Design", 27], ["Types of Locking Mechanism", 24], ["Digital Wallet Code", 19]],
    [["Ride Booking App Design", 45], ["Ride Booking App Code", 24], ["Music Streaming Platform Design", 42], ["Streaming Protocols", 14], ["Music Streaming Platform Code", 27]],
  ],
];